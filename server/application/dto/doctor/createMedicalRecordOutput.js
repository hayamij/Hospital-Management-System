export class CreateMedicalRecordOutput {
	constructor({ recordId, patientId, created, createdAt }) {
		this.recordId = recordId;
		this.patientId = patientId;
		this.created = created;
		this.createdAt = createdAt;
	}
}
