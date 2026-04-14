import assert from 'node:assert';
import { ViewPendingPaymentsUseCase } from '../../../../server/application/use-cases/doctor/viewPendingPayments.usecase.js';
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

class FakePaymentRepository {
	constructor(result) {
		this.result = result;
		this.lastQuery = null;
	}
	async listPendingForDoctor(doctorId, options) {
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
		() => new ViewPendingPaymentsUseCase({
			doctorRepository: new FakeDoctorRepository({}),
			paymentRepository: new FakePaymentRepository({ items: [] }),
		}).execute({}),
		'Doctor id is required.',
	);

	await expectThrows(
		() => new ViewPendingPaymentsUseCase({
			doctorRepository: new FakeDoctorRepository({ [doctorId]: { id: doctorId } }),
			paymentRepository: new FakePaymentRepository({ items: [] }),
		}).execute({ doctorId, page: 0, pageSize: 20 }),
		'Invalid pagination parameters.',
	);

	await expectThrows(
		() => new ViewPendingPaymentsUseCase({
			doctorRepository: new FakeDoctorRepository({}),
			paymentRepository: new FakePaymentRepository({ items: [] }),
		}).execute({ doctorId, page: 1, pageSize: 20 }),
		'Doctor not found.',
	);

	const paymentRepository = new FakePaymentRepository({
		page: 1,
		pageSize: 10,
		total: 1,
		items: [
			{
				id: 'pay-1',
				invoiceId: 'inv-1',
				invoiceNumber: 'INV-001',
				patientId: 'pat-1',
				patientName: 'Alice',
				amount: 100000,
				status: 'pending_confirmation',
				method: 'bank_transfer',
				transferReference: 'CTK-123',
				createdAt: new Date('2026-04-15T11:00:00.000Z'),
			},
		],
	});

	const useCase = new ViewPendingPaymentsUseCase({
		doctorRepository: new FakeDoctorRepository({ [doctorId]: { id: doctorId } }),
		paymentRepository,
	});

	const result = await useCase.execute({ doctorId, page: 1, pageSize: 10 });

	assert.strictEqual(result.total, 1);
	assert.strictEqual(result.payments[0].paymentId, 'pay-1');
	assert.strictEqual(result.payments[0].status, 'pending_confirmation');
	assert.strictEqual(paymentRepository.lastQuery.doctorId, doctorId);
	assert.strictEqual(paymentRepository.lastQuery.options.status, undefined);
}

wrapLegacyRun(run, 'viewPendingPayments.usecase');
