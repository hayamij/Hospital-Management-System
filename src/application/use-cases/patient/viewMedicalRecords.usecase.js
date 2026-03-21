import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewMedicalRecordsInput } from '../../dto/patient/viewMedicalRecordsInput.js';
import { ViewMedicalRecordsOutput } from '../../dto/patient/viewMedicalRecordsOutput.js';

export class ViewMedicalRecordsUseCase {
	constructor({ patientRepository, medicalRecordRepository }) {
		this.patientRepository = patientRepository;
		this.medicalRecordRepository = medicalRecordRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewMedicalRecordsInput
				? inputDto
				: new ViewMedicalRecordsInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}

		const page = Number(input.page) || 1;
		const pageSize = Number(input.pageSize) || 20;
		if (page <= 0 || pageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const recordsRaw = (await this.medicalRecordRepository.findByPatientId(input.patientId)) ?? [];
		const records = Array.isArray(recordsRaw) ? recordsRaw : [recordsRaw].filter(Boolean);
		const total = records.length;
		const start = (page - 1) * pageSize;
		const paged = records.slice(start, start + pageSize);

		return new ViewMedicalRecordsOutput({ records: paged, page, pageSize, total });
	}
}
