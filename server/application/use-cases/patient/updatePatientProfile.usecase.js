import { DomainError } from '../../../domain/exceptions/domainError.js';
import { UpdatePatientProfileInput } from '../../dto/patient/updatePatientProfileInput.js';
import { UpdatePatientProfileOutput } from '../../dto/patient/updatePatientProfileOutput.js';

export class UpdatePatientProfileUseCase {
	constructor({ patientRepository }) {
		this.patientRepository = patientRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof UpdatePatientProfileInput
				? inputDto
				: new UpdatePatientProfileInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		let updated = false;
		if (input.name && String(input.name).trim()) {
			patient.fullName = String(input.name).trim();
			updated = true;
		}

		if (input.dateOfBirth) {
			const dob = input.dateOfBirth instanceof Date ? input.dateOfBirth : new Date(input.dateOfBirth);
			if (Number.isNaN(dob.getTime())) {
				throw new DomainError('Invalid date of birth.');
			}
			patient.dateOfBirth = dob;
			updated = true;
		}

		const contact = { ...(patient.contactInfo ?? {}) };
		if (input.phone && String(input.phone).trim()) {
			contact.phone = String(input.phone).trim();
			updated = true;
		}
		if (input.address && String(input.address).trim()) {
			contact.address = String(input.address).trim();
			updated = true;
		}
		if (input.emergencyContact) {
			contact.emergencyContact = input.emergencyContact;
			updated = true;
		}

		if (updated) {
			if (typeof patient.updateContact === 'function') {
				patient.updateContact(contact);
			} else {
				patient.contactInfo = contact;
			}
			if (typeof patient.touch === 'function') {
				patient.touch();
			} else {
				patient.updatedAt = new Date();
			}
		}

		await this.patientRepository.save(patient);

		return new UpdatePatientProfileOutput({
			patientId: patient.id ?? patient.getId?.() ?? input.patientId,
			updatedAt: patient.updatedAt ?? patient.getUpdatedAt?.() ?? new Date(),
		});
	}
}
