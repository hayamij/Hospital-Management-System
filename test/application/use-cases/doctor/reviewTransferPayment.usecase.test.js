import assert from 'node:assert';
import { ReviewTransferPaymentUseCase } from '../../../../server/application/use-cases/doctor/reviewTransferPayment.usecase.js';
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

class FakeBilling {
	constructor({ id, patientId, doctorId = null, status = 'issued' }) {
		this.id = id;
		this.patientId = patientId;
		this.doctorId = doctorId;
		this.status = status;
	}
	getPatientId() {
		return this.patientId;
	}
	getDoctorId() {
		return this.doctorId;
	}
	getStatus() {
		return this.status;
	}
	markPaid() {
		this.status = 'paid';
	}
}

class FakeBillingRepository {
	constructor(invoices) {
		this.invoices = invoices;
		this.saved = null;
	}
	async findById(id) {
		return this.invoices[id] ?? null;
	}
	async save(billing) {
		this.saved = billing;
		this.invoices[billing.id] = billing;
	}
}

class FakePaymentRepository {
	constructor(payments) {
		this.payments = payments;
		this.updated = null;
	}
	async findById(id) {
		return this.payments[id] ?? null;
	}
	async updateStatus(paymentId, status) {
		this.updated = { paymentId, status };
		const existing = this.payments[paymentId] ?? {};
		this.payments[paymentId] = { ...existing, id: paymentId, status };
		return this.payments[paymentId];
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
	const paymentId = 'pay-1';
	const invoiceId = 'inv-1';
	const patientId = 'pat-1';

	const baseDeps = () => ({
		doctorRepository: new FakeDoctorRepository({ [doctorId]: { id: doctorId } }),
		patientRepository: new FakePatientRepository({ [patientId]: { id: patientId, assignedDoctorId: doctorId } }),
		billingRepository: new FakeBillingRepository({ [invoiceId]: new FakeBilling({ id: invoiceId, patientId }) }),
		paymentRepository: new FakePaymentRepository({
			[paymentId]: {
				id: paymentId,
				invoiceId,
				patientId,
				status: 'pending_confirmation',
			},
		}),
	});

	await expectThrows(
		() => new ReviewTransferPaymentUseCase(baseDeps()).execute({ paymentId, decision: 'confirm' }),
		'Doctor id is required.',
	);

	await expectThrows(
		() => new ReviewTransferPaymentUseCase(baseDeps()).execute({ doctorId, decision: 'confirm' }),
		'Payment id is required.',
	);

	await expectThrows(
		() => new ReviewTransferPaymentUseCase(baseDeps()).execute({ doctorId, paymentId, decision: 'approve' }),
		'Invalid payment review decision.',
	);

	await expectThrows(
		() => new ReviewTransferPaymentUseCase({ ...baseDeps(), doctorRepository: new FakeDoctorRepository({}) }).execute({ doctorId, paymentId, decision: 'confirm' }),
		'Doctor not found.',
	);

	await expectThrows(
		() => new ReviewTransferPaymentUseCase({ ...baseDeps(), paymentRepository: new FakePaymentRepository({}) }).execute({ doctorId, paymentId, decision: 'confirm' }),
		'Payment not found.',
	);

	await expectThrows(
		() => new ReviewTransferPaymentUseCase({
			...baseDeps(),
			paymentRepository: new FakePaymentRepository({
				[paymentId]: { id: paymentId, invoiceId, patientId, status: 'completed' },
			}),
		}).execute({ doctorId, paymentId, decision: 'confirm' }),
		'Only pending transfer payments can be reviewed.',
	);

	await expectThrows(
		() => new ReviewTransferPaymentUseCase({
			...baseDeps(),
			patientRepository: new FakePatientRepository({ [patientId]: { id: patientId, assignedDoctorId: 'doc-2' } }),
		}).execute({ doctorId, paymentId, decision: 'confirm' }),
		'Doctor is not assigned to this patient invoice.',
	);

	const billingOwnedByDoctorDeps = baseDeps();
	billingOwnedByDoctorDeps.patientRepository = new FakePatientRepository({
		[patientId]: { id: patientId, assignedDoctorId: 'doc-2' },
	});
	billingOwnedByDoctorDeps.billingRepository = new FakeBillingRepository({
		[invoiceId]: new FakeBilling({ id: invoiceId, patientId, doctorId }),
	});
	const billingOwnedByDoctorUseCase = new ReviewTransferPaymentUseCase(billingOwnedByDoctorDeps);
	const billingOwnedByDoctorResult = await billingOwnedByDoctorUseCase.execute({ doctorId, paymentId, decision: 'confirm' });
	assert.strictEqual(billingOwnedByDoctorResult.status, 'completed');
	assert.deepStrictEqual(billingOwnedByDoctorDeps.paymentRepository.updated, { paymentId, status: 'completed' });

	const confirmDeps = baseDeps();
	const confirmUseCase = new ReviewTransferPaymentUseCase(confirmDeps);
	const confirmResult = await confirmUseCase.execute({ doctorId, paymentId, decision: 'confirm' });
	assert.strictEqual(confirmResult.status, 'completed');
	assert.strictEqual(confirmResult.invoiceStatus, 'paid');
	assert.strictEqual(confirmDeps.billingRepository.saved.status, 'paid');
	assert.deepStrictEqual(confirmDeps.paymentRepository.updated, { paymentId, status: 'completed' });

	const rejectDeps = baseDeps();
	const rejectUseCase = new ReviewTransferPaymentUseCase(rejectDeps);
	const rejectResult = await rejectUseCase.execute({ doctorId, paymentId, decision: 'reject' });
	assert.strictEqual(rejectResult.status, 'rejected');
	assert.strictEqual(rejectResult.invoiceStatus, 'issued');
	assert.strictEqual(rejectDeps.billingRepository.saved, null);
	assert.deepStrictEqual(rejectDeps.paymentRepository.updated, { paymentId, status: 'rejected' });
}

wrapLegacyRun(run, 'reviewTransferPayment.usecase');
