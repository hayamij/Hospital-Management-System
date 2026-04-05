export class ViewDoctorScheduleOutput {
	constructor({ doctorId, appointments, page = 1, pageSize = 20, total = 0, status = null }) {
		this.doctorId = doctorId;
		this.appointments = appointments;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
		this.status = status;
	}
}
