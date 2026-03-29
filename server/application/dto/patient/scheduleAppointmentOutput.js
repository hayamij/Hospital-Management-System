export class ScheduleAppointmentOutput {
	constructor({ appointmentId, status, startAt, endAt }) {
		this.appointmentId = appointmentId;
		this.status = status;
		this.startAt = startAt;
		this.endAt = endAt;
	}
}
