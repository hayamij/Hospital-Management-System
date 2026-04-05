import assert from 'node:assert';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { ViewDoctorProfileUseCase } from '../../../../server/application/use-cases/doctor/viewDoctorProfile.usecase.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeDoctorRepository {
	constructor(doctors = {}) {
		this.doctors = doctors;
	}

	async findById(id) {
		return this.doctors[id] ?? null;
	}
}

async function expectThrows(fn, expectedMessage) {
	let threw = false;
	try {
		await fn();
	} catch (error) {
		threw = true;
		assert.ok(error instanceof DomainError, 'Expected DomainError');
		if (expectedMessage) {
			assert.strictEqual(error.message, expectedMessage);
		}
	}
	assert.ok(threw, 'Expected function to throw');
}

async function run() {
	await expectThrows(
		() => new ViewDoctorProfileUseCase({ doctorRepository: new FakeDoctorRepository({}) }).execute({}),
		'Doctor id is required.',
	);

	await expectThrows(
		() =>
			new ViewDoctorProfileUseCase({ doctorRepository: new FakeDoctorRepository({}) }).execute({
				doctorId: 'doc-404',
			}),
		'Doctor not found.',
	);

	const updatedAt = new Date('2026-04-05T15:30:00.000Z');
	const doctor = {
		id: 'doc-1',
		fullName: 'Dr. Demo',
		specialization: 'General',
		department: 'Outpatient',
		status: 'active',
		availableSlotsPerDay: 12,
		updatedAt,
	};
	const result = await new ViewDoctorProfileUseCase({
		doctorRepository: new FakeDoctorRepository({ 'doc-1': doctor }),
	}).execute({ doctorId: 'doc-1' });

	assert.strictEqual(result.doctorId, 'doc-1');
	assert.strictEqual(result.fullName, 'Dr. Demo');
	assert.strictEqual(result.specialization, 'General');
	assert.strictEqual(result.department, 'Outpatient');
	assert.strictEqual(result.status, 'active');
	assert.strictEqual(result.slotsPerDay, 12);
	assert.strictEqual(result.updatedAt, updatedAt);
}

wrapLegacyRun(run, 'viewDoctorProfile.usecase');
