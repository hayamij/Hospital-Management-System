import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewPatientMessagesInput } from '../../dto/patient/viewPatientMessagesInput.js';
import { ViewPatientMessagesOutput } from '../../dto/patient/viewPatientMessagesOutput.js';

const normalizeLimit = (value, fallback = 20, max = 200) => {
	const n = Number(value);
	if (!Number.isFinite(n) || n <= 0) return fallback;
	return Math.min(Math.floor(n), max);
};

export class ViewPatientMessagesUseCase {
	constructor({ patientRepository, doctorRepository, messageRepository }) {
		this.patientRepository = patientRepository;
		this.doctorRepository = doctorRepository;
		this.messageRepository = messageRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewPatientMessagesInput
				? inputDto
				: new ViewPatientMessagesInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const doctorId = String(input.doctorId || '').trim() || null;
		if (doctorId) {
			const doctor = await this.doctorRepository.findById(doctorId);
			if (!doctor) {
				throw new DomainError('Doctor not found.');
			}
		}

		const limit = normalizeLimit(input.limit);
		const messages =
			(await this.messageRepository.listForPatient(input.patientId, {
				doctorId,
				limit,
			})) ?? [];

		return new ViewPatientMessagesOutput({
			messages,
			total: messages.length,
			limit,
		});
	}
}
