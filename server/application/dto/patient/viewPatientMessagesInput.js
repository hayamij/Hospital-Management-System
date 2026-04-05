export class ViewPatientMessagesInput {
	constructor({ patientId, doctorId, limit } = {}) {
		this.patientId = patientId;
		this.doctorId = doctorId;
		this.limit = limit;
	}
}
