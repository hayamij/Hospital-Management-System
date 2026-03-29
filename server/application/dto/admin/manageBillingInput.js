export class ManageBillingInput {
	constructor({ adminId, invoiceId, action, dueDate }) {
		this.adminId = adminId;
		this.invoiceId = invoiceId;
		this.action = action; // 'issue' | 'markPaid' | 'void'
		this.dueDate = dueDate;
	}
}
