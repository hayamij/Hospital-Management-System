export class ViewDoctorScheduleInput {
	constructor({ doctorId, from, to }) {
		this.doctorId = doctorId;
		this.from = from;
		this.to = to;
	}
}
