import { defineStore } from 'pinia';
import * as api from '../services/api.js';

const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const useAppStore = defineStore('app', {
	state: () => ({
		user: { id: 'guest', name: 'Guest', role: 'guest', token: null },
		services: [],
		doctors: [],
		patients: [],
		appointments: [],
		billing: [],
		medicalRecords: [],
		messages: [],
		reports: [],
		systemSettings: {},
		doctorSchedule: [],
	}),

	getters: {
		currentUserRole: (state) => state.user?.role ?? 'guest',
	},

	actions: {
		// Auth & session
		async login({ email, password, role, name }) {
			const res = await api.login({ email, password });
			this.user = { id: res.userId ?? res.id ?? makeId('user'), role: role ?? res.role ?? 'patient', name: name ?? email ?? 'User', token: res.token };
			return res;
		},
		async doctorLogin(payload) {
			const res = await api.doctorLogin(payload);
			this.user = { id: res.userId ?? res.id ?? makeId('doctor'), role: 'doctor', name: payload?.name ?? payload?.email ?? 'Doctor', token: res.token };
			return res;
		},
		async adminLogin(payload) {
			const res = await api.adminLogin(payload);
			this.user = { id: res.userId ?? res.id ?? makeId('admin'), role: 'admin', name: payload?.name ?? payload?.email ?? 'Admin', token: res.token };
			return res;
		},
		async logout(payload = {}) {
			await api.logout({ userId: this.user.id, ...payload });
			this.user = { id: 'guest', name: 'Guest', role: 'guest', token: null };
		},
		async resetPassword(email) {
			return api.resetPassword({ email });
		},

		// Guest
		async browsePublicInfo() {
			const res = await api.browsePublicInfo();
			this.services = res?.services ?? res?.items ?? this.services;
			return res;
		},
		async guestSearchDoctors(params) {
			const res = await api.guestSearchDoctors(params);
			this.doctors = res?.doctors ?? [];
			return res;
		},
		async startRegistration(payload) {
			const res = await api.startRegistration(payload);
			this.patients.push({ id: res?.patientId ?? makeId('pat'), name: payload?.name ?? 'New Patient', profile: payload });
			return res;
		},
		async submitContactForm(payload) {
			const res = await api.submitContactForm(payload);
			this.messages.push({ id: makeId('msg'), from: 'guest', ...payload });
			return res;
		},
		async viewAvailableSlots(doctorId, range) {
			return api.viewAvailableSlots({ doctorId, ...range });
		},

		// Patient use cases
		async registerPatientAccount(payload) {
			const res = await api.registerPatientAccount(payload);
			this.patients.push({ id: res?.patientId ?? makeId('pat'), name: payload?.name ?? 'Patient', profile: payload });
			return res;
		},
		async updatePatientProfile(patientId, profile) {
			const res = await api.updatePatientProfile({ patientId, ...profile });
			const patient = this.patients.find((p) => p.id === (res?.patientId ?? patientId));
			if (patient) patient.profile = { ...patient.profile, ...profile };
			return res;
		},
		async scheduleAppointment(input) {
			const res = await api.scheduleAppointment(input);
			this.appointments.push({ id: res.appointmentId, patientId: input.patientId, doctorId: input.doctorId, startAt: res.startAt ?? input.startAt, endAt: res.endAt ?? input.endAt, status: res.status });
			return res;
		},
		async rescheduleAppointment(appointmentId, startAt, endAt) {
			const res = await api.rescheduleAppointment(appointmentId, { startAt, endAt });
			const appt = this.appointments.find((a) => a.id === appointmentId);
			if (appt) Object.assign(appt, { startAt: res.startAt ?? startAt, endAt: res.endAt ?? endAt, status: res.status ?? appt.status });
			return res;
		},
		async cancelAppointment(appointmentId, patientId) {
			const res = await api.cancelAppointment(appointmentId, { patientId });
			const appt = this.appointments.find((a) => a.id === appointmentId);
			if (appt) appt.status = res.status ?? 'cancelled';
			return res;
		},
		async viewAppointments(filter = {}) {
			const res = await api.viewAppointments(filter);
			this.appointments = res?.appointments ?? [];
			return res;
		},
		async viewBillingAndPayments(patientId) {
			const res = await api.viewBillingAndPayments({ patientId });
			this.billing = res?.billings ?? [];
			return res;
		},
		async downloadPrescription(prescriptionId, patientId) {
			return api.downloadPrescription(prescriptionId, { patientId });
		},
		async viewMedicalRecords(patientId) {
			const res = await api.viewMedicalRecords({ patientId });
			this.medicalRecords = res?.records ?? [];
			return res;
		},
		async sendPatientMessage(payload) {
			const res = await api.sendPatientMessage({ patientId: payload.patientId, doctorId: payload.doctorId, subject: payload.subject ?? 'Message', message: payload.text ?? payload.message });
			this.messages.push({ id: res?.messageId ?? makeId('msg'), ...payload });
			return res;
		},

		// Doctor use cases
		async accessPatientChart(patientId, doctorId) {
			return api.accessPatientChart({ patientId, doctorId });
		},
		async addVisitNote(patientId, note, doctorId) {
			const res = await api.addVisitNote(patientId, { patientId, doctorId, note });
			return res;
		},
		async manageAppointmentDecision(appointmentId, decision, doctorId) {
			const res = await api.decideAppointment(appointmentId, { decision, doctorId });
			await this.viewAppointments({ doctorId });
			return res;
		},
		async markAppointmentStatus(appointmentId, status, doctorId) {
			const res = await api.markAppointmentStatus(appointmentId, { status, doctorId });
			await this.viewAppointments({ doctorId });
			return res;
		},
		async reviewTestResults(labResultId, notes, doctorId) {
			return api.reviewTestResults(labResultId, { notes, doctorId });
		},
		async sendDoctorMessage(patientId, text, doctorId) {
			const res = await api.sendDoctorMessage({ patientId, content: text, doctorId });
			this.messages.push({ id: res?.messageId ?? makeId('msg'), from: doctorId ?? this.user.id, to: patientId, text });
			return res;
		},
		async updateDoctorProfileAndAvailability(doctorId, profile) {
			const res = await api.updateDoctorProfile({ doctorId, profile, slotsPerDay: profile?.slotsPerDay });
			return res;
		},
		async updateMedicalRecordEntry(recordId, entry, doctorId) {
			return api.updateMedicalRecordEntry(recordId, { note: entry, doctorId });
		},
		async viewDoctorSchedule(doctorId) {
			const res = await api.viewDoctorSchedule({ doctorId });
			this.doctorSchedule = res?.appointments ?? [];
			return res;
		},

		// Admin use cases
		async manageBilling({ invoiceId, action, dueDate }) {
			const res = await api.manageBilling(invoiceId ?? 'new', { action, dueDate });
			await this.viewBillingAndPayments();
			return res;
		},
		async configureServicesAndPricing(servicePayload) {
			const res = await api.upsertService({ action: servicePayload?.action ?? 'upsert', service: servicePayload });
			await this.browsePublicInfo();
			return res;
		},
		async manageSystemSettings(settings) {
			const res = await api.updateSettings(settings);
			this.systemSettings = res;
			return res;
		},
		async manageUsers(user) {
			if (user?.id && user?.role) await api.assignRoles(user.id, { role: user.role });
			return user;
		},
		async overrideAppointment(appointmentId, payload) {
			return api.overrideAppointment(appointmentId, payload);
		},
		async manageDoctorSchedules(doctorId, slotsPerDay) {
			return api.setDoctorSlots(doctorId, { slotsPerDay });
		},
		async runReports(params) {
			const res = await api.runReport(params);
			this.reports.push(res);
			return res;
		},
		async auditMedicalRecords(recordId, payload) {
			return api.auditRecord(recordId, payload);
		},
		async assignRoles(userId, role) {
			return api.assignRoles(userId, { role });
		},

		// Shared search
		async searchDoctors(query) {
			const res = await api.searchDoctors({ q: query });
			this.doctors = res?.doctors ?? [];
			return res;
		},
	},
});
