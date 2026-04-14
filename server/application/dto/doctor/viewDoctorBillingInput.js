export class ViewDoctorBillingInput {
	constructor({ doctorId, status, page = 1, pageSize = 20 } = {}) {
		this.doctorId = doctorId;
		this.status = status;
		this.page = page;
		this.pageSize = pageSize;
	}
}
