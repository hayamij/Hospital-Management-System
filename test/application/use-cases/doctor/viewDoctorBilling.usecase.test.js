import assert from 'node:assert';
import { ViewDoctorBillingUseCase } from '../../../../server/application/use-cases/doctor/viewDoctorBilling.usecase.js';
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

class FakeBillingRepository {
	constructor(result) {
		this.result = result;
		this.lastQuery = null;
	}
	async listByDoctor(doctorId, options) {
		this.lastQuery = { doctorId, options };
		return this.result;
	}
}

async function expectThrows(fn, message) {
	let threw = false;
	try {
		await fn();
	} catch (error) {
		threw = true;
		assert.ok(error instanceof DomainError, 'Expected DomainError');
		if (message) {
			assert.strictEqual(error.message, message);
		}
	}
	assert.ok(threw, 'Expected function to throw');
}

async function run() {
	const doctorId = 'doc-1';

	await expectThrows(
		() => new ViewDoctorBillingUseCase({
			doctorRepository: new FakeDoctorRepository({}),
			billingRepository: new FakeBillingRepository({ items: [] }),
		}).execute({}),
		'Doctor id is required.',
	);

	await expectThrows(
		() => new ViewDoctorBillingUseCase({
			doctorRepository: new FakeDoctorRepository({ [doctorId]: { id: doctorId } }),
			billingRepository: new FakeBillingRepository({ items: [] }),
		}).execute({ doctorId, page: 0, pageSize: 10 }),
		'Invalid pagination parameters.',
	);

	await expectThrows(
		() => new ViewDoctorBillingUseCase({
			doctorRepository: new FakeDoctorRepository({}),
			billingRepository: new FakeBillingRepository({ items: [] }),
		}).execute({ doctorId, page: 1, pageSize: 10 }),
		'Doctor not found.',
	);

	const billingRepository = new FakeBillingRepository({
		page: 1,
		pageSize: 10,
		total: 1,
		items: [
			{
				id: 'inv-1',
				invoiceNumber: 'INV-001',
				patientId: 'pat-1',
				patientName: 'Alice',
				status: 'issued',
				dueDate: new Date('2026-04-20T00:00:00.000Z'),
				createdAt: new Date('2026-04-15T10:00:00.000Z'),
				charges: [
					{ description: 'Kham tong quat', amount: 150000, note: 'Buoi sang' },
				],
				calculateTotal() {
					return 150000;
				},
			},
		],
	});

	const useCase = new ViewDoctorBillingUseCase({
		doctorRepository: new FakeDoctorRepository({ [doctorId]: { id: doctorId } }),
		billingRepository,
	});

	const result = await useCase.execute({ doctorId, page: 1, pageSize: 10, status: 'issued' });

	assert.strictEqual(result.total, 1);
	assert.strictEqual(result.billings[0].invoiceId, 'inv-1');
	assert.strictEqual(result.billings[0].patientName, 'Alice');
	assert.strictEqual(result.billings[0].amount, 150000);
	assert.strictEqual(result.billings[0].note, 'Buoi sang');
	assert.strictEqual(billingRepository.lastQuery.doctorId, doctorId);
	assert.strictEqual(billingRepository.lastQuery.options.status, 'issued');
}

wrapLegacyRun(run, 'viewDoctorBilling.usecase');
