export class ManageDoctorSchedulesInput {
	constructor({ adminId, doctorId, slotsPerDay }) {
		this.adminId = adminId;
		this.doctorId = doctorId;
		this.slotsPerDay = slotsPerDay;
	}
}
