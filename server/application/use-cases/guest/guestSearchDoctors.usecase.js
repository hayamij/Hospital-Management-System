import { DomainError } from '../../../domain/exceptions/domainError.js';
import { GuestSearchDoctorsInput } from '../../dto/guest/guestSearchDoctorsInput.js';
import { GuestSearchDoctorsOutput } from '../../dto/guest/guestSearchDoctorsOutput.js';

export class GuestSearchDoctorsUseCase {
	constructor({ doctorRepository }) {
		this.doctorRepository = doctorRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof GuestSearchDoctorsInput ? inputDto : new GuestSearchDoctorsInput(inputDto);

		if (input.name && typeof input.name !== 'string') {
			throw new DomainError('Name filter must be a string.');
		}
		if (input.specialization && typeof input.specialization !== 'string') {
			throw new DomainError('Specialization filter must be a string.');
		}

		const doctors = await this.doctorRepository.search({
			name: input.name?.trim(),
			specialization: input.specialization?.trim(),
		});

		return new GuestSearchDoctorsOutput({ doctors: doctors ?? [] });
	}
}
