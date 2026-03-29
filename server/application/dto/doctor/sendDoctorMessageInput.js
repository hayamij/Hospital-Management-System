export class SendDoctorMessageInput {
	constructor({ doctorId, patientId, content }) {
		this.doctorId = doctorId;
		this.patientId = patientId;
		this.content = content;
	}
}
