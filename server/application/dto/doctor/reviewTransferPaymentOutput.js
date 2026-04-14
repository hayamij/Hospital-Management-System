export class ReviewTransferPaymentOutput {
	constructor({ paymentId, invoiceId, status, invoiceStatus, reviewedAt, doctorId, decision }) {
		this.paymentId = paymentId;
		this.invoiceId = invoiceId;
		this.status = status;
		this.invoiceStatus = invoiceStatus;
		this.reviewedAt = reviewedAt;
		this.doctorId = doctorId;
		this.decision = decision;
	}
}
