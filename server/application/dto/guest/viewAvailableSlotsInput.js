export class ViewAvailableSlotsInput {
	constructor({ doctorId, from, to }) {
		this.doctorId = doctorId;
		this.from = from;
		this.to = to;
	}
}
