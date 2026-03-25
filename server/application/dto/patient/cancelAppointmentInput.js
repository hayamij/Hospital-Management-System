export class CancelAppointmentInput {
	constructor({ patientId, appointmentId }) {
		this.patientId = patientId;
		this.appointmentId = appointmentId;
	}
}
