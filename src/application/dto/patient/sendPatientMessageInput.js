export class SendPatientMessageInput {
	constructor({ patientId, doctorId, subject, message }) {
		this.patientId = patientId;
		this.doctorId = doctorId;
		this.subject = subject;
		this.message = message;
	}
}
