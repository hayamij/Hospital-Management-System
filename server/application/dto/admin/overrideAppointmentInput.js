export class OverrideAppointmentInput {
	constructor({ adminId, appointmentId, action, startAt, endAt, doctorId }) {
		this.adminId = adminId;
		this.appointmentId = appointmentId;
		this.action = action; // 'reschedule' | 'cancel' | 'assignDoctor'
		this.startAt = startAt;
		this.endAt = endAt;
		this.doctorId = doctorId;
	}
}
