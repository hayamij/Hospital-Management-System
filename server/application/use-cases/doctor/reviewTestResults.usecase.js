import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ReviewTestResultsInput } from '../../dto/doctor/reviewTestResultsInput.js';
import { ReviewTestResultsOutput } from '../../dto/doctor/reviewTestResultsOutput.js';

export class ReviewTestResultsUseCase {
	constructor({ doctorRepository, labResultRepository }) {
		this.doctorRepository = doctorRepository;
		this.labResultRepository = labResultRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ReviewTestResultsInput ? inputDto : new ReviewTestResultsInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.labResultId) {
			throw new DomainError('Lab result id is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const labResult = await this.labResultRepository.findById(input.labResultId);
		if (!labResult) {
			throw new DomainError('Lab result not found.');
		}

		labResult.reviewedBy = input.doctorId;
		labResult.reviewedAt = new Date();
		if (input.notes && String(input.notes).trim()) {
			labResult.notes = input.notes;
		}

		await this.labResultRepository.save(labResult);

		return new ReviewTestResultsOutput({
			labResultId: labResult.id ?? input.labResultId,
			reviewed: true,
			reviewedAt: labResult.reviewedAt,
		});
	}
}
