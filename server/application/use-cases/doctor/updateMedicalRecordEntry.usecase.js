import { DomainError } from '../../../domain/exceptions/domainError.js';
import { UpdateMedicalRecordEntryInput } from '../../dto/doctor/updateMedicalRecordEntryInput.js';
import { UpdateMedicalRecordEntryOutput } from '../../dto/doctor/updateMedicalRecordEntryOutput.js';

export class UpdateMedicalRecordEntryUseCase {
	constructor({ doctorRepository, medicalRecordRepository }) {
		this.doctorRepository = doctorRepository;
		this.medicalRecordRepository = medicalRecordRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof UpdateMedicalRecordEntryInput ? inputDto : new UpdateMedicalRecordEntryInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.recordId) {
			throw new DomainError('Record id is required.');
		}
		if (!input.note || !String(input.note).trim()) {
			throw new DomainError('Note is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const record = await this.medicalRecordRepository.findById(input.recordId);
		if (!record) {
			throw new DomainError('Medical record not found.');
		}

		record.addEntry({ note: input.note, authorDoctorId: input.doctorId, createdAt: new Date() });
		await this.medicalRecordRepository.save(record);

		const entryCount = record.getEntries?.().length ?? record.entries?.length ?? 0;
		return new UpdateMedicalRecordEntryOutput({ recordId: input.recordId, entryCount });
	}
}
