export class ReviewTransferPaymentInput {
	constructor({ doctorId, paymentId, decision, note } = {}) {
		this.doctorId = doctorId;
		this.paymentId = paymentId;
		this.decision = decision;
		this.note = note;
	}
}
