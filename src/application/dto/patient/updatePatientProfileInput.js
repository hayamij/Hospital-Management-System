export class UpdatePatientProfileInput {
	constructor({ patientId, name, phone, address, dateOfBirth, emergencyContact }) {
		this.patientId = patientId;
		this.name = name;
		this.phone = phone;
		this.address = address;
		this.dateOfBirth = dateOfBirth;
		this.emergencyContact = emergencyContact;
	}
}
