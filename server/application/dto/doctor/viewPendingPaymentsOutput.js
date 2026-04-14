export class ViewPendingPaymentsOutput {
	constructor({ doctorId, payments, page = 1, pageSize = 20, total = 0 }) {
		this.doctorId = doctorId;
		this.payments = payments;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
