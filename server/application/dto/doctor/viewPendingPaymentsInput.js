export class ViewPendingPaymentsInput {
	constructor({ doctorId, page = 1, pageSize = 20, status = null } = {}) {
		this.doctorId = doctorId;
		this.page = page;
		this.pageSize = pageSize;
		this.status = status;
	}
}
