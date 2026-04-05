import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewBillingAndPaymentsInput } from '../../dto/patient/viewBillingAndPaymentsInput.js';
import { ViewBillingAndPaymentsOutput } from '../../dto/patient/viewBillingAndPaymentsOutput.js';

const extractCharges = (billing) => {
	if (Array.isArray(billing?.charges)) return billing.charges;
	if (typeof billing?.getCharges === 'function') {
		const charges = billing.getCharges();
		return Array.isArray(charges) ? charges : [];
	}
	return [];
};

const calculateBillingAmount = (billing) => {
	if (typeof billing?.calculateTotal === 'function') {
		const calculated = Number(billing.calculateTotal());
		if (Number.isFinite(calculated)) return calculated;
	}

	return extractCharges(billing).reduce((sum, line) => sum + (Number(line?.amount) || 0), 0);
};

const toBillingItem = (billing) => {
	const charges = extractCharges(billing);
	const amount = calculateBillingAmount(billing);
	const serviceNames = charges
		.map((line) => line?.serviceName || line?.description || line?.item)
		.filter(Boolean);

	return {
		id: billing?.id ?? billing?.getId?.() ?? null,
		invoiceId: billing?.id ?? billing?.getId?.() ?? null,
		invoiceNumber: billing?.invoiceNumber ?? billing?.getInvoiceNumber?.() ?? null,
		patientId: billing?.patientId ?? billing?.getPatientId?.() ?? null,
		status: billing?.status ?? billing?.getStatus?.() ?? 'draft',
		dueDate: billing?.dueDate ?? billing?.getDueDate?.() ?? null,
		createdAt: billing?.createdAt ?? billing?.getCreatedAt?.() ?? null,
		updatedAt: billing?.updatedAt ?? billing?.getUpdatedAt?.() ?? null,
		charges,
		amount,
		total: amount,
		totalAmount: amount,
		serviceName: serviceNames[0] ?? null,
		note: serviceNames.length ? `Dich vu: ${serviceNames.join(', ')}` : null,
	};
};

const toPaymentItem = (payment) => ({
	id: payment?.id ?? null,
	patientId: payment?.patientId ?? null,
	invoiceId: payment?.invoiceId ?? null,
	amount: Number(payment?.amount) || 0,
	method: payment?.method ?? null,
	status: payment?.status ?? 'initiated',
	createdAt: payment?.createdAt ?? null,
});

export class ViewBillingAndPaymentsUseCase {
	constructor({ patientRepository, billingRepository, paymentRepository }) {
		this.patientRepository = patientRepository;
		this.billingRepository = billingRepository;
		this.paymentRepository = paymentRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewBillingAndPaymentsInput
				? inputDto
				: new ViewBillingAndPaymentsInput(inputDto ?? {});

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

		const billingsRaw = (await this.billingRepository.listByPatient(input.patientId)) ?? [];
		const paymentsRaw = (await this.paymentRepository.listByPatient(input.patientId)) ?? [];

		const billingStatus = input.status ? String(input.status).toLowerCase() : null;
		const billingsFiltered = billingStatus
			? billingsRaw.filter((b) => (b.status ?? b.getStatus?.())?.toLowerCase() === billingStatus)
			: billingsRaw;
		const billingsMapped = billingsFiltered.map(toBillingItem);
		const paymentsMapped = paymentsRaw.map(toPaymentItem);

		const total = billingsMapped.length + paymentsMapped.length;
		const start = (page - 1) * pageSize;
		const billings = billingsMapped.slice(start, start + pageSize);
		const payments = paymentsMapped.slice(start, start + pageSize);

		return new ViewBillingAndPaymentsOutput({ billings, payments, page, pageSize, total });
	}
}
