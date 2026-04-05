import { defineStore } from 'pinia';
import { guestApi, patientApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { useAppointmentsStore } from './appointments.js';
import { normalizeDoctor } from '../services/mappers.js';

const ACTIVE_DOCTOR_STATUSES = new Set(['active', 'verified']);

const toIsoTime = (value) => {
	if (!value) return null;
	const t = new Date(value);
	if (Number.isNaN(t.getTime())) return null;
	return t.toISOString();
};

const isDoctorAvailableForBooking = (doctor) => {
	const status = String(doctor?.status || 'active').toLowerCase();
	return ACTIVE_DOCTOR_STATUSES.has(status);
};

const toDoctorSlotModel = (source, doctor, index = 0) => {
	const start = toIsoTime(source?.start || source?.startAt || source?.from);
	const end = toIsoTime(source?.end || source?.endAt || source?.to);

	if (!start || !end) {
		return {
			id: `${doctor?.id || 'doctor'}-slot-${index + 1}`,
			start: null,
			end: null,
			doctorId: doctor?.id || '',
			doctorName: doctor?.name || '',
			specialty: doctor?.specialty || '',
		};
	}

	return {
		id: source?.id || `${doctor?.id || 'doctor'}-${start}`,
		start,
		end,
		doctorId: doctor?.id || '',
		doctorName: doctor?.name || '',
		specialty: doctor?.specialty || '',
	};
};

const slotSort = (a, b) => {
	const tA = new Date(a.start).getTime();
	const tB = new Date(b.start).getTime();
	if (tA !== tB) return tA - tB;
	return new Date(a.end).getTime() - new Date(b.end).getTime();
};

const aggregateSlotsByWindow = (doctorSlots = []) => {
	const slotMap = new Map();

	for (const slot of doctorSlots) {
		if (!slot?.start || !slot?.end) continue;
		const key = `${slot.start}|${slot.end}`;
		if (!slotMap.has(key)) {
			const startDate = new Date(slot.start);
			const endDate = new Date(slot.end);
			slotMap.set(key, {
				id: key,
				start: slot.start,
				end: slot.end,
				timeLabel: `${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
				doctors: [],
				specialties: [],
				specialtiesDisplay: '',
				doctorNamesDisplay: '',
			});
		}

		const groupedSlot = slotMap.get(key);
		if (!groupedSlot.doctors.some((doctor) => doctor.id === slot.doctorId)) {
			groupedSlot.doctors.push({
				id: slot.doctorId,
				name: slot.doctorName,
				specialty: slot.specialty,
			});
		}
	}

	const groupedSlots = Array.from(slotMap.values());
	for (const slot of groupedSlots) {
		slot.doctors.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
		slot.specialties = Array.from(
			new Set(slot.doctors.map((doctor) => doctor.specialty).filter(Boolean))
		);
		const doctorNames = slot.doctors
			.map((doctor) => doctor.name || doctor.id)
			.filter(Boolean);
		slot.doctorNamesDisplay = doctorNames.length > 2
			? `${doctorNames.slice(0, 2).join(', ')} +${doctorNames.length - 2}`
			: doctorNames.join(', ');

		slot.specialtiesDisplay = slot.specialties.length > 2
			? `${slot.specialties.slice(0, 2).join(', ')} +${slot.specialties.length - 2}`
			: slot.specialties.join(', ');
	}

	groupedSlots.sort(slotSort);
	return groupedSlots;
};

export const useBookingStore = defineStore('booking', {
	state: () => ({
		step: 1,
		doctors: [],
		specialties: [],
		availableSlots: [],
		slotsChecked: false,
		loadingDoctors: false,
		loadingSlots: false,
		submitting: false,
		error: '',
		successMessage: '',
		form: {
			specialty: '',
			doctorFilter: '',
			doctorId: '',
			appointmentDate: '',
			slotStart: '',
			slotEnd: '',
			clinicalSymptoms: '',
		},
	}),
	getters: {
		activeDoctors: (state) => state.doctors.filter(isDoctorAvailableForBooking),
		selectedDoctor: (state) => state.doctors.find((d) => d.id === state.form.doctorId) || null,
		filteredDoctors: (state) => {
			const doctors = state.doctors.filter(isDoctorAvailableForBooking);
			const bySpecialty = state.form.specialty
				? doctors.filter((d) => d.specialty === state.form.specialty)
				: doctors;

			const doctorFilter = String(state.form.doctorFilter || '').trim().toLowerCase();
			if (!doctorFilter) return bySpecialty;

			return bySpecialty.filter((doctor) => {
				const haystack = `${doctor.name || ''} ${doctor.id || ''}`.toLowerCase();
				return haystack.includes(doctorFilter);
			});
		},
		selectedSlot: (state) => {
			return state.availableSlots.find(
				(slot) => slot.start === state.form.slotStart && slot.end === state.form.slotEnd
			) || null;
		},
		availableDoctorsForSelectedTime: (state) => {
			if (!state.form.slotStart || !state.form.slotEnd) return [];
			const selectedSlot = state.availableSlots.find(
				(slot) => slot.start === state.form.slotStart && slot.end === state.form.slotEnd
			);
			if (!selectedSlot?.doctors?.length) return [];

			return selectedSlot.doctors.map((slotDoctor) => {
				return state.doctors.find((doctor) => doctor.id === slotDoctor.id) || slotDoctor;
			});
		},
	},
	actions: {
		clearFeedback() {
			this.error = '';
			this.successMessage = '';
		},
		resetFlow() {
			this.step = 1;
			this.availableSlots = [];
			this.slotsChecked = false;
			this.error = '';
			this.successMessage = '';
			this.form = {
				specialty: '',
				doctorFilter: '',
				doctorId: '',
				appointmentDate: '',
				slotStart: '',
				slotEnd: '',
				clinicalSymptoms: '',
			};
		},
		setSpecialty(value) {
			this.form.specialty = value || '';
			this.error = '';

			if (this.form.doctorId) {
				const doc = this.doctors.find((d) => d.id === this.form.doctorId);
				if (!doc || (this.form.specialty && doc.specialty !== this.form.specialty)) {
					this.form.doctorId = '';
				}
			}

			if (this.form.appointmentDate) {
				this.fetchAvailableSlots().catch(() => {
					// error already handled in store state
				});
			}
		},
		setDoctorFilter(value) {
			this.form.doctorFilter = String(value || '').trim();
			this.error = '';

			if (this.form.doctorId) {
				const stillVisible = this.filteredDoctors.some((doctor) => doctor.id === this.form.doctorId);
				if (!stillVisible) {
					this.form.doctorId = '';
				}
			}

			if (this.form.appointmentDate) {
				this.fetchAvailableSlots().catch(() => {
					// error already handled in store state
				});
			}
		},
		setDoctor(doctorId) {
			this.form.doctorId = doctorId || '';
			this.error = '';

			const doc = this.doctors.find((d) => d.id === doctorId);
			if (doc && !this.form.specialty) {
				this.form.specialty = doc.specialty;
			}

			if (!this.form.doctorId) {
				return;
			}

			const currentWindowSlot = this.availableSlots.find(
				(slot) => slot.start === this.form.slotStart && slot.end === this.form.slotEnd
			);
			if (currentWindowSlot?.doctors?.some((slotDoctor) => slotDoctor.id === this.form.doctorId)) {
				return;
			}

			const firstDoctorSlot = this.availableSlots.find((slot) =>
				slot.doctors?.some((slotDoctor) => slotDoctor.id === this.form.doctorId)
			);
			if (firstDoctorSlot) {
				this.selectSlot(firstDoctorSlot);
			}
		},
		setDate(value) {
			this.form.appointmentDate = value || '';
			this.error = '';

			if (!this.form.appointmentDate) {
				this.availableSlots = [];
				this.slotsChecked = false;
				this.form.slotStart = '';
				this.form.slotEnd = '';
				return;
			}

			this.fetchAvailableSlots().catch(() => {
				// error already handled in store state
			});
		},
		selectSlot(slot) {
			if (!slot) {
				this.form.slotStart = '';
				this.form.slotEnd = '';
				return;
			}

			this.form.slotStart = slot?.start || '';
			this.form.slotEnd = slot?.end || '';
			const availableDoctors = Array.isArray(slot?.doctors) ? slot.doctors : [];
			if (!availableDoctors.some((doctor) => doctor.id === this.form.doctorId)) {
				this.form.doctorId = availableDoctors[0]?.id || '';
			}
			if (!this.form.specialty) {
				this.form.specialty = availableDoctors[0]?.specialty || this.form.specialty;
			}
			this.error = '';
		},
		async initialize() {
			if (this.doctors.length > 0) return;
			await this.fetchDoctors();
		},
		async fetchDoctors() {
			this.loadingDoctors = true;
			this.error = '';
			try {
				const result = await patientApi.searchDoctors({ page: 1, pageSize: 200 });
				const list = Array.isArray(result?.doctors) ? result.doctors : [];
				const normalized = list.map(normalizeDoctor).sort((a, b) => a.name.localeCompare(b.name));
				const availableDoctors = normalized.filter(isDoctorAvailableForBooking);
				const specialtiesSource = availableDoctors.length ? availableDoctors : normalized;
				this.doctors = normalized;
				this.specialties = Array.from(new Set(specialtiesSource.map((d) => d.specialty))).sort((a, b) => a.localeCompare(b));
			} catch (error) {
				this.error = error?.message || 'Failed to load doctors.';
				throw error;
			} finally {
				this.loadingDoctors = false;
			}
		},
		async fetchAvailableSlots() {
			this.loadingSlots = true;
			this.error = '';
			this.slotsChecked = false;
			try {
				if (!this.form.appointmentDate) {
					this.availableSlots = [];
					this.form.slotStart = '';
					this.form.slotEnd = '';
					return [];
				}

				const doctorsToQuery = this.filteredDoctors.length
					? this.filteredDoctors
					: this.activeDoctors;

				if (doctorsToQuery.length === 0) {
					this.availableSlots = [];
					this.form.slotStart = '';
					this.form.slotEnd = '';
					this.slotsChecked = true;
					this.error = 'Không có bác sĩ khả dụng cho bộ lọc hiện tại.';
					return [];
				}

				const responses = await Promise.allSettled(
					doctorsToQuery.map(async (doctor) => {
						const result = await guestApi.availableSlots(doctor.id, {
							from: this.form.appointmentDate,
							to: this.form.appointmentDate,
						});
						const slots = Array.isArray(result?.slots) ? result.slots : [];
						return slots
							.map((slot, index) => toDoctorSlotModel(slot, doctor, index))
							.filter((slot) => slot.start && slot.end);
					})
				);

				const successful = responses.filter((item) => item.status === 'fulfilled');
				if (successful.length === 0) {
					throw new Error('Không thể tải khung giờ trống. Vui lòng thử lại.');
				}

				const allDoctorSlots = successful.flatMap((item) => item.value || []);
				const uniqueDoctorSlots = [];
				const seen = new Set();
				for (const slot of allDoctorSlots) {
					const key = `${slot.doctorId}|${slot.start}|${slot.end}`;
					if (seen.has(key)) continue;
					seen.add(key);
					uniqueDoctorSlots.push(slot);
				}

				const groupedSlots = aggregateSlotsByWindow(uniqueDoctorSlots);
				this.availableSlots = groupedSlots;
				this.slotsChecked = true;

				if (!groupedSlots.length) {
					this.form.slotStart = '';
					this.form.slotEnd = '';
					this.form.doctorId = '';
					return [];
				}

				const currentSlot = groupedSlots.find(
					(slot) =>
						slot.start === this.form.slotStart &&
						slot.end === this.form.slotEnd
				);

				const preferredSlotByDoctor = this.form.doctorId
					? groupedSlots.find((slot) => slot.doctors?.some((doctor) => doctor.id === this.form.doctorId))
					: null;

				this.selectSlot(currentSlot || preferredSlotByDoctor || groupedSlots[0]);
				return groupedSlots;
			} catch (error) {
				this.error = error?.message || 'Failed to load available slots.';
				throw error;
			} finally {
				this.loadingSlots = false;
			}
		},
		goNext() {
			this.error = '';
			if (this.step === 1) {
				if (!this.form.appointmentDate || !this.form.slotStart || !this.form.slotEnd) {
					this.error = 'Vui lòng chọn ngày khám và một khung giờ trống.';
					return false;
				}
			}
			if (this.step === 2) {
				if (!this.form.doctorId) {
					this.error = 'Vui lòng chọn bác sĩ phù hợp với khung giờ đã chọn.';
					return false;
				}
			}
			if (this.step === 3) {
				if (!this.form.clinicalSymptoms.trim()) {
					this.error = 'Please fill clinical symptoms before continuing.';
					return false;
				}
			}
			this.step = Math.min(this.step + 1, 4);
			return true;
		},
		goBack() {
			this.error = '';
			this.step = Math.max(this.step - 1, 1);
		},
		async submitAppointment() {
			this.submitting = true;
			this.error = '';
			this.successMessage = '';
			try {
				if (this.step !== 4) throw new Error('Please complete all booking steps.');
				const auth = useAuthStore();
				if (!auth.userId) throw new Error('Patient identity is missing. Please login again.');
				const appointments = useAppointmentsStore();
				await appointments.schedule({
					doctorId: this.form.doctorId,
					startAt: this.form.slotStart,
					endAt: this.form.slotEnd,
					reason: this.form.clinicalSymptoms.trim(),
				});
				this.successMessage = 'Appointment created successfully.';
			} catch (error) {
				this.error = error?.message || 'Failed to create appointment.';
				throw error;
			} finally {
				this.submitting = false;
			}
		},
	},
});
