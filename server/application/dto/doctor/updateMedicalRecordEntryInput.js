export class UpdateMedicalRecordEntryInput {
	constructor({ doctorId, recordId, note }) {
		this.doctorId = doctorId;
		this.recordId = recordId;
		this.note = note;
	}
}
