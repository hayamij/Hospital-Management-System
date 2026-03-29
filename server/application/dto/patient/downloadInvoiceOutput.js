export class DownloadInvoiceOutput {
	constructor({ invoiceId, file, filename, contentType }) {
		this.invoiceId = invoiceId;
		this.file = file;
		this.filename = filename;
		this.contentType = contentType;
	}
}