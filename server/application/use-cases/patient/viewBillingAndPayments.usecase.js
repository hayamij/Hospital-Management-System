import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewBillingAndPaymentsInput } from '../../dto/patient/viewBillingAndPaymentsInput.js';
import { ViewBillingAndPaymentsOutput } from '../../dto/patient/viewBillingAndPaymentsOutput.js';

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

		const total = billingsFiltered.length + paymentsRaw.length;
		const start = (page - 1) * pageSize;
		const billings = billingsFiltered.slice(start, start + pageSize);
		const payments = paymentsRaw.slice(start, start + pageSize);

		return new ViewBillingAndPaymentsOutput({ billings, payments, page, pageSize, total });
	}
}
