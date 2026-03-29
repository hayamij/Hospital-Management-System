import { DomainError } from '../../../domain/exceptions/domainError.js';
import { AccessPatientChartInput } from '../../dto/doctor/accessPatientChartInput.js';
import { AccessPatientChartOutput } from '../../dto/doctor/accessPatientChartOutput.js';

export class AccessPatientChartUseCase {
	constructor({ doctorRepository, patientRepository, medicalRecordRepository }) {
		this.doctorRepository = doctorRepository;
		this.patientRepository = patientRepository;
		this.medicalRecordRepository = medicalRecordRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof AccessPatientChartInput ? inputDto : new AccessPatientChartInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const record = await this.medicalRecordRepository.findByPatientId(input.patientId);
		const entries = record?.getEntries?.() ?? record?.entries ?? [];

		return new AccessPatientChartOutput({ patientId: input.patientId, entries });
	}
}
