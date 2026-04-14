import assert from 'node:assert';
import { SubmitTransferPaymentUseCase } from '../../../../server/application/use-cases/patient/submitTransferPayment.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
	constructor(patients) {
		this.patients = patients;
	}
	async findById(id) {
		return this.patients[id] ?? null;
	}
}

class FakeBilling {
	constructor({ id, patientId, total = 100, status = 'issued' }) {
		this.id = id;
		this.patientId = patientId;
		this.total = total;
		this.status = status;
	}
	getPatientId() {
		return this.patientId;
	}
	getStatus() {
		return this.status;
	}
	calculateTotal() {
		return this.total;
	}
}

class FakeBillingRepository {
	constructor(invoices) {
		this.invoices = invoices;
	}
	async findById(id) {
		return this.invoices[id] ?? null;
	}
}

class FakePaymentRepository {
	constructor(payments = []) {
		this.payments = payments;
		this.created = null;
	}
	async listByPatient(_patientId) {
		return this.payments;
	}
	async create(payload) {
		this.created = payload;
		return {
			id: 'pay-new',
			patientId: payload.patientId,
			invoiceId: payload.invoiceId,
			amount: payload.amount,
			method: payload.method,
			transferReference: payload.transferReference,
			status: payload.status,
			createdAt: new Date('2026-04-15T10:00:00.000Z'),
		};
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
	const patientId = 'pat-1';
	const invoiceId = 'inv-1';
	const patient = { id: patientId };
	const invoice = new FakeBilling({ id: invoiceId, patientId, total: 125000, status: 'issued' });

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({}),
			billingRepository: new FakeBillingRepository({}),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ invoiceId, amount: 125000, transferReference: 'REF-1' }),
		'Patient id is required.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({}),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, amount: 125000, transferReference: 'REF-1' }),
		'Invoice id is required.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({ [invoiceId]: invoice }),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, invoiceId, amount: 125000, transferReference: '' }),
		'Transfer reference is required.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({ [invoiceId]: invoice }),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, invoiceId, amount: 0, transferReference: 'REF-1' }),
		'Payment amount must be greater than 0.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({}),
			billingRepository: new FakeBillingRepository({ [invoiceId]: invoice }),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, invoiceId, amount: 125000, transferReference: 'REF-1' }),
		'Patient not found.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({}),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, invoiceId, amount: 125000, transferReference: 'REF-1' }),
		'Invoice not found.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({ [invoiceId]: new FakeBilling({ id: invoiceId, patientId: 'pat-2', total: 125000 }) }),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, invoiceId, amount: 125000, transferReference: 'REF-1' }),
		'Invoice does not belong to patient.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({ [invoiceId]: new FakeBilling({ id: invoiceId, patientId, total: 125000, status: 'paid' }) }),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, invoiceId, amount: 125000, transferReference: 'REF-1' }),
		'Invoice is not payable.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({ [invoiceId]: invoice }),
			paymentRepository: new FakePaymentRepository(),
		}).execute({ patientId, invoiceId, amount: 100000, transferReference: 'REF-1' }),
		'Payment amount must match invoice total.',
	);

	await expectThrows(
		() => new SubmitTransferPaymentUseCase({
			patientRepository: new FakePatientRepository({ [patientId]: patient }),
			billingRepository: new FakeBillingRepository({ [invoiceId]: invoice }),
			paymentRepository: new FakePaymentRepository([
				{ id: 'pay-1', invoiceId, status: 'pending_confirmation' },
			]),
		}).execute({ patientId, invoiceId, amount: 125000, transferReference: 'REF-1' }),
		'A transfer payment request is already pending confirmation.',
	);

	const paymentRepository = new FakePaymentRepository();
	const useCase = new SubmitTransferPaymentUseCase({
		patientRepository: new FakePatientRepository({ [patientId]: patient }),
		billingRepository: new FakeBillingRepository({ [invoiceId]: invoice }),
		paymentRepository,
	});

	const result = await useCase.execute({
		patientId,
		invoiceId,
		amount: 125000,
		transferReference: 'CTK-9988',
		note: 'Da chuyen khoan luc 10:00',
	});

	assert.strictEqual(result.paymentId, 'pay-new');
	assert.strictEqual(result.status, 'pending_confirmation');
	assert.strictEqual(result.transferReference, 'CTK-9988');
	assert.strictEqual(paymentRepository.created.status, 'pending_confirmation');
	assert.strictEqual(paymentRepository.created.transferReference, 'CTK-9988');
}

wrapLegacyRun(run, 'submitTransferPayment.usecase');
