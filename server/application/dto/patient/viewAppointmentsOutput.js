export class ViewAppointmentsOutput {
	constructor({ appointments, page, pageSize, total }) {
		this.appointments = appointments;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
