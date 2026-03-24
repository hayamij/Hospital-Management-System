import { defineStore } from 'pinia';
import { guestApi, patientApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { useAppointmentsStore } from './appointments.js';
import { normalizeDoctor } from '../services/mappers.js';

const toIsoTime = (value) => {
	if (!value) return null;
	const t = new Date(value);
	if (Number.isNaN(t.getTime())) return null;
	return t.toISOString();
};

const toSlotModel = (source, index = 0) => {
	const start = toIsoTime(source?.start || source?.startAt || source?.from);
	const end = toIsoTime(source?.end || source?.endAt || source?.to);

	if (!start || !end) {
		return {
			id: `slot-${index + 1}`,
			start: null,
			end: null,
			label: 'Invalid slot',
		};
	}

	const startDate = new Date(start);
	const endDate = new Date(end);
	const label = `${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

	return {
		id: source?.id || `slot-${index + 1}`,
		start,
		end,
		label,
	};
};

export const useBookingStore = defineStore('booking', {
	state: () => ({
		step: 1,
		doctors: [],
		specialties: [],
		availableSlots: [],
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
		selectedDoctor: (state) => state.doctors.find((d) => d.id === state.form.doctorId) || null,
		filteredDoctors: (state) => {
			if (!state.form.specialty) return state.doctors;
			return state.doctors.filter((d) => d.specialty === state.form.specialty);
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
			if (this.form.doctorId) {
				const doc = this.doctors.find((d) => d.id === this.form.doctorId);
				if (!doc || (this.form.specialty && doc.specialty !== this.form.specialty)) {
					this.form.doctorId = '';
				}
			}
		},
		setDoctor(doctorId) {
			this.form.doctorId = doctorId || '';
			const doc = this.doctors.find((d) => d.id === doctorId);
			if (doc && !this.form.specialty) {
				this.form.specialty = doc.specialty;
			}
			this.availableSlots = [];
			this.form.slotStart = '';
			this.form.slotEnd = '';
		},
		setDate(value) {
			this.form.appointmentDate = value || '';
			this.availableSlots = [];
			this.form.slotStart = '';
			this.form.slotEnd = '';
		},
		selectSlot(slot) {
			this.form.slotStart = slot?.start || '';
			this.form.slotEnd = slot?.end || '';
		},
		async initialize() {
			if (this.doctors.length > 0) return;
			await this.fetchDoctors();
		},
		async fetchDoctors() {
			this.loadingDoctors = true;
			this.error = '';
			try {
				const result = await patientApi.searchDoctors({ page: 1, pageSize: 100 });
				const list = Array.isArray(result?.doctors) ? result.doctors : [];
				const normalized = list.map(normalizeDoctor);
				this.doctors = normalized;
				this.specialties = Array.from(new Set(normalized.map((d) => d.specialty))).sort((a, b) => a.localeCompare(b));
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
			this.availableSlots = [];
			this.form.slotStart = '';
			this.form.slotEnd = '';
			try {
				if (!this.form.doctorId || !this.form.appointmentDate) {
					throw new Error('Please select doctor and date first.');
				}
				const result = await guestApi.availableSlots(this.form.doctorId, {
					from: this.form.appointmentDate,
					to: this.form.appointmentDate,
				});
				const slots = Array.isArray(result?.slots) ? result.slots : [];
				this.availableSlots = slots.map(toSlotModel).filter((slot) => slot.start && slot.end);
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
				if (!this.form.specialty || !this.form.doctorId) {
					this.error = 'Please choose specialty and doctor.';
					return false;
				}
			}
			if (this.step === 2) {
				if (!this.form.appointmentDate || !this.form.slotStart || !this.form.slotEnd) {
					this.error = 'Please choose date and a time slot.';
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
