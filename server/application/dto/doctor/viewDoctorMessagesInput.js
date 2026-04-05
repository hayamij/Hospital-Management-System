export class ViewDoctorMessagesInput {
	constructor({ doctorId, patientId, limit } = {}) {
		this.doctorId = doctorId;
		this.patientId = patientId;
		this.limit = limit;
	}
}
