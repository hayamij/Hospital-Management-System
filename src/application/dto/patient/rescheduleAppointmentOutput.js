export class RescheduleAppointmentOutput {
	constructor({ appointmentId, status, startAt, endAt }) {
		this.appointmentId = appointmentId;
		this.status = status;
		this.startAt = startAt;
		this.endAt = endAt;
	}
}
