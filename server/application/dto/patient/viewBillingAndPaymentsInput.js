export class ViewBillingAndPaymentsInput {
	constructor({ patientId, page = 1, pageSize = 20, status }) {
		this.patientId = patientId;
		this.page = page;
		this.pageSize = pageSize;
		this.status = status;
	}
}
