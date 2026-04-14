import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewDoctorBillingInput } from '../../dto/doctor/viewDoctorBillingInput.js';
import { ViewDoctorBillingOutput } from '../../dto/doctor/viewDoctorBillingOutput.js';

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
		patientName: billing?.patientName ?? null,
		status: billing?.status ?? billing?.getStatus?.() ?? 'draft',
		dueDate: billing?.dueDate ?? billing?.getDueDate?.() ?? null,
		createdAt: billing?.createdAt ?? billing?.getCreatedAt?.() ?? null,
		updatedAt: billing?.updatedAt ?? billing?.getUpdatedAt?.() ?? null,
		charges,
		amount,
		total: amount,
		totalAmount: amount,
		serviceName: serviceNames[0] ?? null,
		note: charges.map((line) => line?.note).filter(Boolean).join(' | ') || null,
	};
};

export class ViewDoctorBillingUseCase {
	constructor({ doctorRepository, billingRepository }) {
		this.doctorRepository = doctorRepository;
		this.billingRepository = billingRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewDoctorBillingInput
				? inputDto
				: new ViewDoctorBillingInput(inputDto ?? {});

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}

		const pageInput = input.page;
		const pageSizeInput = input.pageSize;
		const page =
			pageInput === undefined || pageInput === null || pageInput === ''
				? 1
				: Number(pageInput);
		const pageSize =
			pageSizeInput === undefined || pageSizeInput === null || pageSizeInput === ''
				? 20
				: Number(pageSizeInput);
		if (!Number.isFinite(page) || !Number.isFinite(pageSize) || page <= 0 || pageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const listed = await this.billingRepository.listByDoctor(input.doctorId, {
			status: input.status,
			page,
			pageSize,
		});
		const items = Array.isArray(listed?.items) ? listed.items : [];

		return new ViewDoctorBillingOutput({
			doctorId: input.doctorId,
			billings: items.map(toBillingItem),
			page: Number(listed?.page) || Math.floor(page),
			pageSize: Number(listed?.pageSize) || Math.floor(pageSize),
			total: Number(listed?.total) || items.length,
		});
	}
}
