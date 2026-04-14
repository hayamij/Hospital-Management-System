export class SubmitTransferPaymentOutput {
	constructor({ paymentId, patientId, invoiceId, amount, status, method, transferReference, submittedAt, note }) {
		this.paymentId = paymentId;
		this.patientId = patientId;
		this.invoiceId = invoiceId;
		this.amount = amount;
		this.status = status;
		this.method = method;
		this.transferReference = transferReference;
		this.submittedAt = submittedAt;
		this.note = note;
	}
}
