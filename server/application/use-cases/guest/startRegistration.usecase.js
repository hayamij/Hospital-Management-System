import { DomainError } from '../../../domain/exceptions/domainError.js';
import { StartRegistrationInput } from '../../dto/guest/startRegistrationInput.js';
import { StartRegistrationOutput } from '../../dto/guest/startRegistrationOutput.js';

export class StartRegistrationUseCase {
	constructor({ patientRepository }) {
		this.patientRepository = patientRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof StartRegistrationInput ? inputDto : new StartRegistrationInput(inputDto);

		if (!input.fullName || !String(input.fullName).trim()) {
			throw new DomainError('Full name is required.');
		}
		if (!input.email || !String(input.email).trim()) {
			throw new DomainError('Email is required.');
		}
		if (!input.phone || !String(input.phone).trim()) {
			throw new DomainError('Phone is required.');
		}

		const patient = {
			fullName: String(input.fullName).trim(),
			contactInfo: { email: String(input.email).trim(), phone: String(input.phone).trim() },
			status: 'pending',
			createdAt: new Date(),
		};

		const created = await this.patientRepository.create(patient);
		const patientId = created?.id ?? created?.patientId ?? created;

		return new StartRegistrationOutput({ patientId, status: 'pending' });
	}
}
