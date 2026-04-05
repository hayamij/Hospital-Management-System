export class ViewBillingInput {
	constructor({ adminId, status, patientId, page = 1, pageSize = 20 }) {
		this.adminId = adminId;
		this.status = status;
		this.patientId = patientId;
		this.page = page;
		this.pageSize = pageSize;
	}
}
