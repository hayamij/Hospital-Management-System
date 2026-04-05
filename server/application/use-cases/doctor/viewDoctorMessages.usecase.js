import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewDoctorMessagesInput } from '../../dto/doctor/viewDoctorMessagesInput.js';
import { ViewDoctorMessagesOutput } from '../../dto/doctor/viewDoctorMessagesOutput.js';

const normalizeLimit = (value, fallback = 20, max = 200) => {
	const n = Number(value);
	if (!Number.isFinite(n) || n <= 0) return fallback;
	return Math.min(Math.floor(n), max);
};

export class ViewDoctorMessagesUseCase {
	constructor({ doctorRepository, patientRepository, messageRepository }) {
		this.doctorRepository = doctorRepository;
		this.patientRepository = patientRepository;
		this.messageRepository = messageRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewDoctorMessagesInput
				? inputDto
				: new ViewDoctorMessagesInput(inputDto ?? {});

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const patientId = String(input.patientId || '').trim() || null;
		if (patientId) {
			const patient = await this.patientRepository.findById(patientId);
			if (!patient) {
				throw new DomainError('Patient not found.');
			}
		}

		const limit = normalizeLimit(input.limit);
		const messages =
			(await this.messageRepository.listForDoctor(input.doctorId, {
				patientId,
				limit,
			})) ?? [];

		return new ViewDoctorMessagesOutput({
			messages,
			total: messages.length,
			limit,
		});
	}
}
