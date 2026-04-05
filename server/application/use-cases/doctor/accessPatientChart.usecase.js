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
		const rawEntries = record?.getEntries?.() ?? record?.entries ?? [];
		const doctorNameCache = new Map();

		const resolveDoctorName = async (doctorId) => {
			if (!doctorId) return null;
			if (doctorNameCache.has(doctorId)) return doctorNameCache.get(doctorId);

			const entryDoctor = await this.doctorRepository.findById(doctorId);
			const doctorName =
				entryDoctor?.fullName ??
				entryDoctor?.getName?.() ??
				null;

			doctorNameCache.set(doctorId, doctorName);
			return doctorName;
		};

		const entries = await Promise.all(
			rawEntries.map(async (entry) => {
				const rawEntry = entry && typeof entry === 'object' ? entry : { note: String(entry ?? '') };
				const authorDoctorId = rawEntry.authorDoctorId ?? rawEntry.doctorId ?? null;
				const doctorName =
					rawEntry.doctorName ??
					rawEntry.authorDoctorName ??
					(await resolveDoctorName(authorDoctorId));

				return {
					...rawEntry,
					doctorId: rawEntry.doctorId ?? authorDoctorId,
					authorDoctorId: rawEntry.authorDoctorId ?? authorDoctorId,
					doctorName: doctorName ?? null,
					authorDoctorName: rawEntry.authorDoctorName ?? doctorName ?? null,
				};
			})
		);
		const recordId = record?.id ?? record?.getId?.() ?? null;
		const recordCreatedAt = record?.createdAt ?? record?.getCreatedAt?.() ?? null;

		return new AccessPatientChartOutput({
			patientId: input.patientId,
			entries,
			recordId,
			recordCreatedAt,
			hasRecord: Boolean(record),
		});
	}
}
