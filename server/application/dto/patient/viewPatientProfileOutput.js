export class ViewPatientProfileOutput {
	constructor({ patientId, fullName, dateOfBirth, email, phone, address, emergencyContact, status, assignedDoctorId, updatedAt }) {
		this.patientId = patientId;
		this.fullName = fullName;
		this.dateOfBirth = dateOfBirth;
		this.email = email;
		this.phone = phone;
		this.address = address;
		this.emergencyContact = emergencyContact;
		this.status = status;
		this.assignedDoctorId = assignedDoctorId;
		this.updatedAt = updatedAt;
	}
}
