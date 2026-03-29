import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ManageBillingInput } from '../../dto/admin/manageBillingInput.js';
import { ManageBillingOutput } from '../../dto/admin/manageBillingOutput.js';

export class ManageBillingUseCase {
	constructor({ billingRepository, userRepository }) {
		this.billingRepository = billingRepository;
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ManageBillingInput ? inputDto : new ManageBillingInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.invoiceId) {
			throw new DomainError('Invoice id is required.');
		}
		const allowedActions = new Set(['issue', 'markPaid', 'void']);
		if (!allowedActions.has(input.action)) {
			throw new DomainError('Invalid billing action.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		if (!adminUser || adminUser.role !== 'admin') {
			throw new DomainError('Access denied. Admin role required.');
		}

		const billing = await this.billingRepository.findById(input.invoiceId);
		if (!billing) {
			throw new DomainError('Invoice not found.');
		}

		switch (input.action) {
			case 'issue': {
				if (!input.dueDate) {
					throw new DomainError('Due date is required to issue an invoice.');
				}
				const due = input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate);
				billing.issue(due);
				break;
			}
			case 'markPaid': {
				billing.markPaid();
				break;
			}
			case 'void': {
				billing.void();
				break;
			}
			default:
				throw new DomainError('Unsupported billing action.');
		}

		await this.billingRepository.save(billing);

		return new ManageBillingOutput({
			invoiceId: billing.getInvoiceNumber(),
			status: billing.getStatus(),
			total: billing.calculateTotal(),
			dueDate: billing.getDueDate(),
		});
	}
}
