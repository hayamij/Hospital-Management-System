import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ReviewTransferPaymentInput } from '../../dto/doctor/reviewTransferPaymentInput.js';
import { ReviewTransferPaymentOutput } from '../../dto/doctor/reviewTransferPaymentOutput.js';

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const resolveBillingStatus = (billing) => normalizeStatus(billing?.status ?? billing?.getStatus?.());

const markBillingPaid = (billing) => {
	if (typeof billing?.markPaid === 'function') {
		billing.markPaid();
		return;
	}
	billing.status = 'paid';
	if (typeof billing?.touch === 'function') {
		billing.touch();
	}
};

export class ReviewTransferPaymentUseCase {
	constructor({ doctorRepository, patientRepository, billingRepository, paymentRepository }) {
		this.doctorRepository = doctorRepository;
		this.patientRepository = patientRepository;
		this.billingRepository = billingRepository;
		this.paymentRepository = paymentRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ReviewTransferPaymentInput
				? inputDto
				: new ReviewTransferPaymentInput(inputDto ?? {});

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.paymentId) {
			throw new DomainError('Payment id is required.');
		}

		const decision = normalizeStatus(input.decision);
		if (decision !== 'confirm' && decision !== 'reject') {
			throw new DomainError('Invalid payment review decision.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const payment = await this.paymentRepository.findById(input.paymentId);
		if (!payment) {
			throw new DomainError('Payment not found.');
		}

		const paymentStatus = normalizeStatus(payment.status);
		if (paymentStatus !== 'pending_confirmation') {
			throw new DomainError('Only pending transfer payments can be reviewed.');
		}

		if (!payment.invoiceId) {
			throw new DomainError('Payment is missing invoice reference.');
		}

		const billing = await this.billingRepository.findById(payment.invoiceId);
		if (!billing) {
			throw new DomainError('Invoice not found for payment.');
		}

		const patientId = billing?.patientId ?? billing?.getPatientId?.() ?? payment.patientId;
		if (!patientId) {
			throw new DomainError('Invoice is missing patient reference.');
		}

		const patient = await this.patientRepository.findById(patientId);
		if (!patient) {
			throw new DomainError('Patient not found for invoice.');
		}

		const invoiceDoctorId =
			billing?.doctorId
			?? billing?.getDoctorId?.()
			?? patient?.assignedDoctorId
			?? null;

		if (!invoiceDoctorId || String(invoiceDoctorId) !== String(input.doctorId)) {
			throw new DomainError('Doctor is not assigned to this patient invoice.');
		}

		let invoiceStatus = resolveBillingStatus(billing);
		let nextPaymentStatus = 'rejected';

		if (decision === 'confirm') {
			if (invoiceStatus === 'void') {
				throw new DomainError('Cannot confirm payment for void invoice.');
			}
			nextPaymentStatus = 'completed';
			if (invoiceStatus !== 'paid') {
				markBillingPaid(billing);
				await this.billingRepository.save(billing);
				invoiceStatus = resolveBillingStatus(billing);
			}
		}

		const updatedPayment = await this.paymentRepository.updateStatus(payment.id, nextPaymentStatus);

		return new ReviewTransferPaymentOutput({
			paymentId: updatedPayment?.id ?? payment.id,
			invoiceId: payment.invoiceId,
			status: updatedPayment?.status ?? nextPaymentStatus,
			invoiceStatus,
			reviewedAt: new Date(),
			doctorId: input.doctorId,
			decision,
		});
	}
}
