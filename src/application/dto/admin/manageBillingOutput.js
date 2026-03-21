export class ManageBillingOutput {
	constructor({ invoiceId, status, total, dueDate }) {
		this.invoiceId = invoiceId;
		this.status = status;
		this.total = total;
		this.dueDate = dueDate;
	}
}
