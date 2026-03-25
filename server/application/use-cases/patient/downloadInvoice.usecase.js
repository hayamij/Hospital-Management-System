import { DomainError } from '../../../domain/exceptions/domainError.js';
import { DownloadInvoiceInput } from '../../dto/patient/downloadInvoiceInput.js';
import { DownloadInvoiceOutput } from '../../dto/patient/downloadInvoiceOutput.js';

const inferAmount = (billing) => {
	if (typeof billing?.amount === 'number') return billing.amount;
	if (typeof billing?.total === 'number') return billing.total;

	const charges = Array.isArray(billing?.charges) ? billing.charges : [];
	return charges.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
};

export class DownloadInvoiceUseCase {
	constructor({ patientRepository, billingRepository }) {
		this.patientRepository = patientRepository;
		this.billingRepository = billingRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof DownloadInvoiceInput
				? inputDto
				: new DownloadInvoiceInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.invoiceId) {
			throw new DomainError('Invoice id is required.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const billing = await this.billingRepository.findById(input.invoiceId);
		if (!billing) {
			throw new DomainError('Invoice not found.');
		}

		const billingPatientId = billing.patientId ?? billing.getPatientId?.();
		if (billingPatientId && billingPatientId !== input.patientId) {
			throw new DomainError('Invoice does not belong to patient.');
		}

		const invoiceId = billing.id ?? billing.getId?.() ?? input.invoiceId;
		const payload = {
			invoiceId,
			invoiceNumber: billing.invoiceNumber ?? billing.getInvoiceNumber?.() ?? invoiceId,
			patientId: billingPatientId ?? input.patientId,
			status: billing.status ?? billing.getStatus?.() ?? 'unknown',
			dueDate: billing.dueDate ?? billing.getDueDate?.() ?? null,
			amount: inferAmount(billing),
			charges: billing.charges ?? billing.getCharges?.() ?? [],
		};

		return new DownloadInvoiceOutput({
			invoiceId,
			file: JSON.stringify(payload, null, 2),
			filename: `${invoiceId}.json`,
			contentType: 'application/json',
		});
	}
}