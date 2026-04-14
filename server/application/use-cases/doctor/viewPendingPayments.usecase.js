import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewPendingPaymentsInput } from '../../dto/doctor/viewPendingPaymentsInput.js';
import { ViewPendingPaymentsOutput } from '../../dto/doctor/viewPendingPaymentsOutput.js';

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const toPaymentItem = (payment) => ({
	id: payment?.id ?? null,
	paymentId: payment?.id ?? null,
	invoiceId: payment?.invoiceId ?? null,
	invoiceNumber: payment?.invoiceNumber ?? null,
	invoiceStatus: payment?.invoiceStatus ?? null,
	patientId: payment?.patientId ?? null,
	patientName: payment?.patientName ?? null,
	amount: Number(payment?.amount) || 0,
	method: payment?.method ?? 'bank_transfer',
	transferReference: payment?.transferReference ?? null,
	status: normalizeStatus(payment?.status) || 'pending_confirmation',
	createdAt: payment?.createdAt ?? null,
});

export class ViewPendingPaymentsUseCase {
	constructor({ doctorRepository, paymentRepository }) {
		this.doctorRepository = doctorRepository;
		this.paymentRepository = paymentRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewPendingPaymentsInput
				? inputDto
				: new ViewPendingPaymentsInput(inputDto ?? {});

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}

		const page = Number(input.page);
		const pageSize = Number(input.pageSize);
		if (!Number.isFinite(page) || !Number.isFinite(pageSize) || page <= 0 || pageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const listed = await this.paymentRepository.listPendingForDoctor(input.doctorId, {
			page,
			pageSize,
			status: input.status || undefined,
		});
		const items = Array.isArray(listed?.items) ? listed.items : [];

		return new ViewPendingPaymentsOutput({
			doctorId: input.doctorId,
			payments: items.map(toPaymentItem),
			page: Number(listed?.page) || Math.floor(page),
			pageSize: Number(listed?.pageSize) || Math.floor(pageSize),
			total: Number(listed?.total) || items.length,
		});
	}
}
