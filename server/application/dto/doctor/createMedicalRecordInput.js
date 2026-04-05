export class CreateMedicalRecordInput {
	constructor({ doctorId, patientId }) {
		this.doctorId = doctorId;
		this.patientId = patientId;
	}
}
