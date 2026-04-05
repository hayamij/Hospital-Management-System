export class ViewAppointmentsInput {
	constructor({ adminId, status, doctorId, patientId, page = 1, pageSize = 20 }) {
		this.adminId = adminId;
		this.status = status;
		this.doctorId = doctorId;
		this.patientId = patientId;
		this.page = page;
		this.pageSize = pageSize;
	}
}
