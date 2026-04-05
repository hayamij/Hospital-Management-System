export class ViewDoctorScheduleInput {
	constructor({ doctorId, from, to, status, page = 1, pageSize = 20 }) {
		this.doctorId = doctorId;
		this.from = from;
		this.to = to;
		this.status = status;
		this.page = page;
		this.pageSize = pageSize;
	}
}
