export class OverrideAppointmentOutput {
	constructor({ appointmentId, status, startAt, endAt, doctorId }) {
		this.appointmentId = appointmentId;
		this.status = status;
		this.startAt = startAt;
		this.endAt = endAt;
		this.doctorId = doctorId;
	}
}
