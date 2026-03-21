export class ReviewTestResultsInput {
	constructor({ doctorId, labResultId, notes }) {
		this.doctorId = doctorId;
		this.labResultId = labResultId;
		this.notes = notes;
	}
}
