export class ViewDoctorBillingOutput {
	constructor({ doctorId, billings, page = 1, pageSize = 20, total = 0 }) {
		this.doctorId = doctorId;
		this.billings = billings;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
