import assert from 'node:assert';
import { CreateMedicalRecordUseCase } from '../../../../server/application/use-cases/doctor/createMedicalRecord.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeDoctorRepository {
	constructor(doctors) {
		this.doctors = doctors;
	}
	async findById(id) {
		return this.doctors[id] ?? null;
	}
}

class FakePatientRepository {
	constructor(patients) {
		this.patients = patients;
	}
	async findById(id) {
		return this.patients[id] ?? null;
	}
}

class FakeMedicalRecordRepository {
	constructor(records = {}) {
		this.records = records;
		this.saved = [];
	}
	async findByPatientId(patientId) {
		return this.records[patientId] ?? null;
	}
	async save(record) {
		const persisted = { ...record, id: record.id || 'mr-1', patientId: record.patientId, createdAt: record.createdAt || new Date() };
		this.saved.push(persisted);
		this.records[persisted.patientId] = persisted;
		return persisted;
	}
}

const doctor = { id: 'doc-1' };
const patient = { id: 'pat-1' };

async function expectThrows(fn, message) {
	let threw = false;
	try {
		await fn();
	} catch (err) {
		threw = true;
		assert.ok(err instanceof DomainError, 'Expected DomainError');
		if (message) {
			assert.strictEqual(err.message, message);
		}
	}
	assert.ok(threw, 'Expected function to throw');
}

async function run() {
	await expectThrows(
		() =>
			new CreateMedicalRecordUseCase({
				doctorRepository: new FakeDoctorRepository({}),
				patientRepository: new FakePatientRepository({}),
				medicalRecordRepository: new FakeMedicalRecordRepository(),
			}).execute({ patientId: patient.id }),
		'Doctor id is required.'
	);

	await expectThrows(
		() =>
			new CreateMedicalRecordUseCase({
				doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
				patientRepository: new FakePatientRepository({}),
				medicalRecordRepository: new FakeMedicalRecordRepository(),
			}).execute({ doctorId: doctor.id }),
		'Patient id is required.'
	);

	await expectThrows(
		() =>
			new CreateMedicalRecordUseCase({
				doctorRepository: new FakeDoctorRepository({}),
				patientRepository: new FakePatientRepository({ [patient.id]: patient }),
				medicalRecordRepository: new FakeMedicalRecordRepository(),
			}).execute({ doctorId: doctor.id, patientId: patient.id }),
		'Doctor not found.'
	);

	await expectThrows(
		() =>
			new CreateMedicalRecordUseCase({
				doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
				patientRepository: new FakePatientRepository({}),
				medicalRecordRepository: new FakeMedicalRecordRepository(),
			}).execute({ doctorId: doctor.id, patientId: patient.id }),
		'Patient not found.'
	);

	{
		const existingRecord = { id: 'mr-existing', patientId: patient.id, createdAt: new Date('2025-01-01T00:00:00Z') };
		const medRepo = new FakeMedicalRecordRepository({ [patient.id]: existingRecord });
		const result = await new CreateMedicalRecordUseCase({
			doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
			patientRepository: new FakePatientRepository({ [patient.id]: patient }),
			medicalRecordRepository: medRepo,
		}).execute({ doctorId: doctor.id, patientId: patient.id });

		assert.strictEqual(result.recordId, 'mr-existing');
		assert.strictEqual(result.patientId, patient.id);
		assert.strictEqual(result.created, false);
		assert.strictEqual(medRepo.saved.length, 0);
	}

	{
		const medRepo = new FakeMedicalRecordRepository();
		const result = await new CreateMedicalRecordUseCase({
			doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
			patientRepository: new FakePatientRepository({ [patient.id]: patient }),
			medicalRecordRepository: medRepo,
		}).execute({ doctorId: doctor.id, patientId: patient.id });

		assert.strictEqual(result.patientId, patient.id);
		assert.strictEqual(result.created, true);
		assert.strictEqual(result.recordId, 'mr-1');
		assert.strictEqual(medRepo.saved.length, 1);
		assert.strictEqual(medRepo.saved[0].patientId, patient.id);
	}
}

wrapLegacyRun(run, 'createMedicalRecord.usecase');
