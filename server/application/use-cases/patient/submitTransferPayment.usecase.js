import { DomainError } from '../../../domain/exceptions/domainError.js';
import { SubmitTransferPaymentInput } from '../../dto/patient/submitTransferPaymentInput.js';
import { SubmitTransferPaymentOutput } from '../../dto/patient/submitTransferPaymentOutput.js';

const PENDING_PAYMENT_STATUSES = new Set(['pending_confirmation', 'initiated', 'processing']);
const EPSILON = 0.01;

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const toAmount = (value) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const extractCharges = (billing) => {
	if (Array.isArray(billing?.charges)) return billing.charges;
	if (typeof billing?.getCharges === 'function') {
		const charges = billing.getCharges();
		return Array.isArray(charges) ? charges : [];
	}
	return [];
};

const calculateTotal = (billing) => {
	if (typeof billing?.calculateTotal === 'function') {
		const calculated = Number(billing.calculateTotal());
		if (Number.isFinite(calculated)) return calculated;
	}

	return extractCharges(billing).reduce((sum, line) => sum + (Number(line?.amount) || 0), 0);
};

export class SubmitTransferPaymentUseCase {
	constructor({ patientRepository, billingRepository, paymentRepository }) {
		this.patientRepository = patientRepository;
		this.billingRepository = billingRepository;
		this.paymentRepository = paymentRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof SubmitTransferPaymentInput
				? inputDto
				: new SubmitTransferPaymentInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.invoiceId) {
			throw new DomainError('Invoice id is required.');
		}

		const normalizedReference = String(input.transferReference || '').trim();
		if (!normalizedReference) {
			throw new DomainError('Transfer reference is required.');
		}

		const amount = toAmount(input.amount);
		if (!Number.isFinite(amount) || amount <= 0) {
			throw new DomainError('Payment amount must be greater than 0.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const billing = await this.billingRepository.findById(input.invoiceId);
		if (!billing) {
			throw new DomainError('Invoice not found.');
		}

		const invoicePatientId = billing?.patientId ?? billing?.getPatientId?.() ?? null;
		if (!invoicePatientId || String(invoicePatientId) !== String(input.patientId)) {
			throw new DomainError('Invoice does not belong to patient.');
		}

		const invoiceStatus = normalizeStatus(billing?.status ?? billing?.getStatus?.());
		if (invoiceStatus === 'paid' || invoiceStatus === 'void') {
			throw new DomainError('Invoice is not payable.');
		}

		const invoiceTotal = calculateTotal(billing);
		if (Math.abs(invoiceTotal - amount) > EPSILON) {
			throw new DomainError('Payment amount must match invoice total.');
		}

		const existingPayments = (await this.paymentRepository.listByPatient(input.patientId)) ?? [];
		const hasPending = existingPayments.some(
			(payment) =>
				String(payment?.invoiceId || '') === String(input.invoiceId)
				&& PENDING_PAYMENT_STATUSES.has(normalizeStatus(payment?.status)),
		);
		if (hasPending) {
			throw new DomainError('A transfer payment request is already pending confirmation.');
		}

		const createdPayment = await this.paymentRepository.create({
			patientId: input.patientId,
			invoiceId: input.invoiceId,
			amount,
			method: input.method || 'bank_transfer',
			transferReference: normalizedReference,
			status: 'pending_confirmation',
		});

		return new SubmitTransferPaymentOutput({
			paymentId: createdPayment?.id ?? null,
			patientId: createdPayment?.patientId ?? input.patientId,
			invoiceId: createdPayment?.invoiceId ?? input.invoiceId,
			amount: Number(createdPayment?.amount) || amount,
			status: createdPayment?.status ?? 'pending_confirmation',
			method: createdPayment?.method ?? 'bank_transfer',
			transferReference: createdPayment?.transferReference ?? normalizedReference,
			submittedAt: createdPayment?.createdAt ?? new Date(),
			note: String(input.note || '').trim() || null,
		});
	}
}
