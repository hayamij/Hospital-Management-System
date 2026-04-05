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

const toSlotModel = (source, doctor, index = 0) => {
	const start = toIsoTime(source?.start || source?.startAt || source?.from);
	const end = toIsoTime(source?.end || source?.endAt || source?.to);

	if (!start || !end) {
		return {
			id: `${doctor?.id || 'doctor'}-slot-${index + 1}`,
			start: null,
			end: null,
			label: 'Invalid slot',
			doctorId: doctor?.id || '',
			doctorName: doctor?.name || '',
			specialty: doctor?.specialty || '',
		};
	}

	const startDate = new Date(start);
	const endDate = new Date(end);
	const timeLabel = `${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
	const doctorLabel = doctor?.name ? ` • ${doctor.name}` : '';
	const specialtyLabel = doctor?.specialty ? ` (${doctor.specialty})` : '';

	return {
		id: source?.id || `${doctor?.id || 'doctor'}-${start}`,
		start,
		end,
		label: `${timeLabel}${doctorLabel}${specialtyLabel}`,
		timeLabel,
		doctorId: doctor?.id || '',
		doctorName: doctor?.name || '',
		specialty: doctor?.specialty || '',
	};
};

const slotSort = (a, b) => {
	const tA = new Date(a.start).getTime();
	const tB = new Date(b.start).getTime();
	if (tA !== tB) return tA - tB;
	return String(a.doctorName || '').localeCompare(String(b.doctorName || ''));
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
			if (!state.form.specialty) return doctors;
			return doctors.filter((d) => d.specialty === state.form.specialty);
		},
		selectedSlot: (state) => {
			return (
				state.availableSlots.find(
					(slot) =>
						slot.start === state.form.slotStart &&
						slot.end === state.form.slotEnd &&
						slot.doctorId === state.form.doctorId
				) ||
				state.availableSlots.find(
					(slot) => slot.start === state.form.slotStart && slot.end === state.form.slotEnd
				) ||
				null
			);
		},
		availableDoctorsForSelectedTime: (state) => {
			if (!state.form.slotStart || !state.form.slotEnd) return [];
			const map = new Map();
			for (const slot of state.availableSlots) {
				if (slot.start !== state.form.slotStart || slot.end !== state.form.slotEnd) continue;
				if (!slot.doctorId || map.has(slot.doctorId)) continue;
				const doctor = state.doctors.find((item) => item.id === slot.doctorId);
				if (doctor) {
					map.set(slot.doctorId, doctor);
				}
			}
			return Array.from(map.values());
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

			const exactWindowSlot = this.availableSlots.find(
				(slot) =>
					slot.doctorId === this.form.doctorId &&
					slot.start === this.form.slotStart &&
					slot.end === this.form.slotEnd
			);

			if (exactWindowSlot) {
				this.selectSlot(exactWindowSlot);
				return;
			}

			const firstDoctorSlot = this.availableSlots.find((slot) => slot.doctorId === this.form.doctorId);
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
			if (slot?.doctorId) {
				this.form.doctorId = slot.doctorId;
			}
			if (slot?.specialty && !this.form.specialty) {
				this.form.specialty = slot.specialty;
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
						return slots.map((slot, index) => toSlotModel(slot, doctor, index)).filter((slot) => slot.start && slot.end);
					})
				);

				const successful = responses.filter((item) => item.status === 'fulfilled');
				if (successful.length === 0) {
					throw new Error('Không thể tải khung giờ trống. Vui lòng thử lại.');
				}

				const allSlots = successful.flatMap((item) => item.value || []);
				const uniqueSlots = [];
				const seen = new Set();
				for (const slot of allSlots) {
					const key = `${slot.doctorId}|${slot.start}|${slot.end}`;
					if (seen.has(key)) continue;
					seen.add(key);
					uniqueSlots.push(slot);
				}

				uniqueSlots.sort(slotSort);
				this.availableSlots = uniqueSlots;
				this.slotsChecked = true;

				if (!uniqueSlots.length) {
					this.form.slotStart = '';
					this.form.slotEnd = '';
					return [];
				}

				const currentSlot = uniqueSlots.find(
					(slot) =>
						slot.start === this.form.slotStart &&
						slot.end === this.form.slotEnd &&
						(!this.form.doctorId || slot.doctorId === this.form.doctorId)
				);

				const preferredSlot =
					(this.form.doctorId && uniqueSlots.find((slot) => slot.doctorId === this.form.doctorId)) ||
					null;

				this.selectSlot(currentSlot || preferredSlot || uniqueSlots[0]);
				return uniqueSlots;
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
