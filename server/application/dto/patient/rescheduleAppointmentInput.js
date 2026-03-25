export class RescheduleAppointmentInput {
	constructor({ patientId, appointmentId, startAt, endAt }) {
		this.patientId = patientId;
		this.appointmentId = appointmentId;
		this.startAt = startAt;
		this.endAt = endAt;
	}
}
