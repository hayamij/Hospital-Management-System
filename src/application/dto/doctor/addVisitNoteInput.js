export class AddVisitNoteInput {
	constructor({ doctorId, patientId, note }) {
		this.doctorId = doctorId;
		this.patientId = patientId;
		this.note = note;
	}
}
