export class UpdateDoctorProfileAndAvailabilityInput {
	constructor({ doctorId, profile = {}, slotsPerDay }) {
		this.doctorId = doctorId;
		this.profile = profile; // { fullName, specialization, department, status }
		this.slotsPerDay = slotsPerDay;
	}
}
