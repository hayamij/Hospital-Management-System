import { DomainError } from '../../../domain/exceptions/domainError.js';
import { SearchDoctorsInput } from '../../dto/patient/searchDoctorsInput.js';
import { SearchDoctorsOutput } from '../../dto/patient/searchDoctorsOutput.js';

export class SearchDoctorsUseCase {
	constructor({ doctorRepository }) {
		this.doctorRepository = doctorRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof SearchDoctorsInput ? inputDto : new SearchDoctorsInput(inputDto ?? {});

		const page = Number(input.page) || 1;
		const pageSize = Number(input.pageSize) || 20;
		if (page <= 0 || pageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}

		const results =
			(await this.doctorRepository.search({
				name: input.query ? String(input.query).trim() : undefined,
				specialization: input.specialty ? String(input.specialty).trim() : undefined,
			})) ?? [];

		const normalized = Array.isArray(results) ? results : [results];
		const total = normalized.length;
		const start = (page - 1) * pageSize;
		const doctors = normalized.slice(start, start + pageSize);

		return new SearchDoctorsOutput({ doctors, page, pageSize, total });
	}
}
