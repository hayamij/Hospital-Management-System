export class DownloadInvoiceInput {
	constructor({ patientId, invoiceId }) {
		this.patientId = patientId;
		this.invoiceId = invoiceId;
	}
}