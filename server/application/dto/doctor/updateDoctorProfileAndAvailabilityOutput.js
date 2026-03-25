export class UpdateDoctorProfileAndAvailabilityOutput {
	constructor({ doctorId, profile, slotsPerDay }) {
		this.doctorId = doctorId;
		this.profile = profile;
		this.slotsPerDay = slotsPerDay;
	}
}
