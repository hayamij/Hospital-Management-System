import { DomainError } from '../../../domain/exceptions/domainError.js';
import { MedicalRecord } from '../../../domain/entities/medicalRecord.js';
import { StartRegistrationInput } from '../../dto/guest/startRegistrationInput.js';
import { StartRegistrationOutput } from '../../dto/guest/startRegistrationOutput.js';
import { isValidEmail, normalizeEmail } from '../../utils/email.js';

export class StartRegistrationUseCase {
	constructor({ patientRepository, medicalRecordRepository }) {
		this.patientRepository = patientRepository;
		this.medicalRecordRepository = medicalRecordRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof StartRegistrationInput ? inputDto : new StartRegistrationInput(inputDto);

		if (!input.fullName || !String(input.fullName).trim()) {
			throw new DomainError('Full name is required.');
		}
		if (!input.email || !String(input.email).trim()) {
			throw new DomainError('Email is required.');
		}
		if (!isValidEmail(input.email)) {
			throw new DomainError('Email format is invalid. Expected format: name@abc.xyz.');
		}
		if (!input.phone || !String(input.phone).trim()) {
			throw new DomainError('Phone is required.');
		}

		const email = normalizeEmail(input.email);

		const patient = {
			fullName: String(input.fullName).trim(),
			contactInfo: { email, phone: String(input.phone).trim() },
			status: 'pending',
			createdAt: new Date(),
		};

		const created = await this.patientRepository.create(patient);
		const patientId = created?.id ?? created?.patientId ?? created;

		if (patientId && this.medicalRecordRepository) {
			const existingRecord =
				typeof this.medicalRecordRepository.findByPatientId === 'function'
					? await this.medicalRecordRepository.findByPatientId(patientId)
					: null;

			if (!existingRecord && typeof this.medicalRecordRepository.save === 'function') {
				await this.medicalRecordRepository.save(
					new MedicalRecord({ patientId, entries: [] })
				);
			}
		}

		return new StartRegistrationOutput({ patientId, status: 'pending' });
	}
}
