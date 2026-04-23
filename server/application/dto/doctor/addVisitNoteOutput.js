export class AddVisitNoteOutput {
	constructor({ patientId, recordId, entryCount }) {
		this.patientId = patientId;
		this.recordId = recordId;
		this.entryCount = entryCount;
	}
}
