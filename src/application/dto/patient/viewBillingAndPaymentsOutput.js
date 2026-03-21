export class ViewBillingAndPaymentsOutput {
	constructor({ billings, payments, page, pageSize, total }) {
		this.billings = billings;
		this.payments = payments;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
