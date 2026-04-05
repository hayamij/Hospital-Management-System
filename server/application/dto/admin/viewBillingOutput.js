export class ViewBillingOutput {
	constructor({ billings, page, pageSize, total }) {
		this.billings = billings;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
