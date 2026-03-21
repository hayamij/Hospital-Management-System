export class ManageAppointmentDecisionInput {
	constructor({ doctorId, appointmentId, decision, reason }) {
		this.doctorId = doctorId;
		this.appointmentId = appointmentId;
		this.decision = decision; // 'accept' | 'reject'
		this.reason = reason;
	}
}
