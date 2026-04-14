export class SubmitTransferPaymentInput {
	constructor({
		patientId,
		invoiceId,
		amount,
		transferReference,
		note,
		method = 'bank_transfer',
	} = {}) {
		this.patientId = patientId;
		this.invoiceId = invoiceId;
		this.amount = amount;
		this.transferReference = transferReference;
		this.note = note;
		this.method = method;
	}
}
