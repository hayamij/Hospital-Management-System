import { DomainError } from '../../../domain/exceptions/domainError.js';
import { MedicalRecord } from '../../../domain/entities/medicalRecord.js';
import { CreateMedicalRecordInput } from '../../dto/doctor/createMedicalRecordInput.js';
import { CreateMedicalRecordOutput } from '../../dto/doctor/createMedicalRecordOutput.js';

export class CreateMedicalRecordUseCase {
	constructor({ doctorRepository, patientRepository, medicalRecordRepository }) {
		this.doctorRepository = doctorRepository;
		this.patientRepository = patientRepository;
		this.medicalRecordRepository = medicalRecordRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof CreateMedicalRecordInput
				? inputDto
				: new CreateMedicalRecordInput(inputDto ?? {});

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

		const existingRecord = await this.medicalRecordRepository.findByPatientId(input.patientId);
		if (existingRecord) {
			return new CreateMedicalRecordOutput({
				recordId: existingRecord.id ?? existingRecord.getId?.() ?? null,
				patientId: input.patientId,
				created: false,
				createdAt: existingRecord.createdAt ?? existingRecord.getCreatedAt?.() ?? null,
			});
		}

		const savedRecord = await this.medicalRecordRepository.save(
			new MedicalRecord({ patientId: input.patientId, entries: [] })
		);

		return new CreateMedicalRecordOutput({
			recordId: savedRecord?.id ?? savedRecord?.getId?.() ?? null,
			patientId: input.patientId,
			created: true,
			createdAt: savedRecord?.createdAt ?? savedRecord?.getCreatedAt?.() ?? new Date(),
		});
	}
}
