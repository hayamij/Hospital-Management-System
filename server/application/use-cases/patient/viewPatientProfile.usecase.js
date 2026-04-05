import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewPatientProfileInput } from '../../dto/patient/viewPatientProfileInput.js';
import { ViewPatientProfileOutput } from '../../dto/patient/viewPatientProfileOutput.js';

export class ViewPatientProfileUseCase {
	constructor({ patientRepository }) {
		this.patientRepository = patientRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewPatientProfileInput
				? inputDto
				: new ViewPatientProfileInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const contact = patient.contactInfo ?? patient.getContact?.() ?? {};

		return new ViewPatientProfileOutput({
			patientId: patient.id ?? patient.getId?.() ?? input.patientId,
			fullName: patient.fullName ?? patient.getName?.() ?? '',
			dateOfBirth: patient.dateOfBirth ?? patient.getDateOfBirth?.() ?? null,
			email: contact.email ?? null,
			phone: contact.phone ?? null,
			address: contact.address ?? null,
			emergencyContact: contact.emergencyContact ?? null,
			status: patient.status ?? patient.getStatus?.() ?? 'active',
			assignedDoctorId: patient.assignedDoctorId ?? patient.getAssignedDoctorId?.() ?? null,
			updatedAt: patient.updatedAt ?? patient.getUpdatedAt?.() ?? null,
		});
	}
}
