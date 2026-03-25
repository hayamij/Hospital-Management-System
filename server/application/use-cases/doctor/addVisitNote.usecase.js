import { DomainError } from '../../../domain/exceptions/domainError.js';
import { AddVisitNoteInput } from '../../dto/doctor/addVisitNoteInput.js';
import { AddVisitNoteOutput } from '../../dto/doctor/addVisitNoteOutput.js';

export class AddVisitNoteUseCase {
	constructor({ doctorRepository, patientRepository, medicalRecordRepository }) {
		this.doctorRepository = doctorRepository;
		this.patientRepository = patientRepository;
		this.medicalRecordRepository = medicalRecordRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof AddVisitNoteInput ? inputDto : new AddVisitNoteInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.note || !String(input.note).trim()) {
			throw new DomainError('Visit note is required.');
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
		if (!record) {
			throw new DomainError('Medical record not found for patient.');
		}

		record.addEntry({ note: input.note, authorDoctorId: input.doctorId, createdAt: new Date() });
		await this.medicalRecordRepository.save(record);

		const entryCount = record.getEntries?.().length ?? record.entries?.length ?? 0;
		return new AddVisitNoteOutput({ patientId: input.patientId, entryCount });
	}
}
