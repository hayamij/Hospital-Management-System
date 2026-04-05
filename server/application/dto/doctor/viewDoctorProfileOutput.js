export class ViewDoctorProfileOutput {
	constructor({ doctorId, fullName, specialization, department, status, slotsPerDay, updatedAt }) {
		this.doctorId = doctorId;
		this.fullName = fullName;
		this.specialization = specialization;
		this.department = department;
		this.status = status;
		this.slotsPerDay = slotsPerDay;
		this.updatedAt = updatedAt;
	}
}
