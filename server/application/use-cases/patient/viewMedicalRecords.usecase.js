import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewMedicalRecordsInput } from '../../dto/patient/viewMedicalRecordsInput.js';
import { ViewMedicalRecordsOutput } from '../../dto/patient/viewMedicalRecordsOutput.js';

const toTimestamp = (value) => {
	const parsed = new Date(value || '').getTime();
	return Number.isNaN(parsed) ? 0 : parsed;
};

const ensureObject = (value) => {
	if (value && typeof value === 'object') return value;
	return { note: String(value ?? '') };
};

export class ViewMedicalRecordsUseCase {
	constructor({ patientRepository, medicalRecordRepository, doctorRepository }) {
		this.patientRepository = patientRepository;
		this.medicalRecordRepository = medicalRecordRepository;
		this.doctorRepository = doctorRepository;
	}

	async resolveDoctorName(doctorId, cache) {
		if (!doctorId || !this.doctorRepository?.findById) return null;
		if (cache.has(doctorId)) return cache.get(doctorId);

		const doctor = await this.doctorRepository.findById(doctorId);
		const doctorName = doctor?.fullName ?? doctor?.getName?.() ?? null;
		cache.set(doctorId, doctorName);
		return doctorName;
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

		const storedRecord =
			(await this.medicalRecordRepository.findByPatientId(input.patientId)) ?? null;
		const hasRecord = Boolean(storedRecord);
		const recordId = storedRecord?.id ?? storedRecord?.getId?.() ?? null;
		const recordCreatedAt = storedRecord?.createdAt ?? storedRecord?.getCreatedAt?.() ?? null;

		const rawEntries = Array.isArray(storedRecord)
			? storedRecord
			: storedRecord?.getEntries?.() ?? storedRecord?.entries ?? [];

		const doctorNameCache = new Map();
		const mappedEntries = await Promise.all(
			rawEntries.map(async (entry, index) => {
				const raw = ensureObject(entry);
				const authorDoctorId = raw.authorDoctorId ?? raw.doctorId ?? null;
				const doctorName =
					raw.doctorName ??
					raw.authorDoctorName ??
					(await this.resolveDoctorName(authorDoctorId, doctorNameCache));
				const recordedAt = raw.recordedAt ?? raw.createdAt ?? raw.visitDate ?? raw.date ?? null;

				return {
					id: raw.id ?? `${recordId || input.patientId}-entry-${index + 1}`,
					recordId,
					patientId: input.patientId,
					visitDate: raw.visitDate ?? raw.date ?? recordedAt,
					recordedAt,
					createdAt: raw.createdAt ?? recordedAt,
					description: raw.description ?? raw.note ?? '',
					note: raw.note ?? raw.description ?? '',
					diagnosis: raw.diagnosis ?? raw.title ?? null,
					doctorId: raw.doctorId ?? authorDoctorId,
					authorDoctorId: raw.authorDoctorId ?? authorDoctorId,
					doctorName: doctorName ?? null,
					authorDoctorName: raw.authorDoctorName ?? doctorName ?? null,
				};
			})
		);

		const records = mappedEntries.sort(
			(a, b) => toTimestamp(b.recordedAt || b.visitDate) - toTimestamp(a.recordedAt || a.visitDate)
		);
		const total = records.length;
		const start = (page - 1) * pageSize;
		const paged = records.slice(start, start + pageSize);

		return new ViewMedicalRecordsOutput({
			records: paged,
			page,
			pageSize,
			total,
			hasRecord,
			recordId,
			recordCreatedAt,
		});
	}
}
