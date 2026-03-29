export class ScheduleAppointmentInput {
	constructor({ patientId, doctorId, startAt, endAt, reason }) {
		this.patientId = patientId;
		this.doctorId = doctorId;
		this.startAt = startAt;
		this.endAt = endAt;
		this.reason = reason;
	}
}
