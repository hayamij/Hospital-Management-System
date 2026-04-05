import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewBillingInput } from '../../dto/admin/viewBillingInput.js';
import { ViewBillingOutput } from '../../dto/admin/viewBillingOutput.js';

export class ViewBillingUseCase {
	constructor({ userRepository, billingRepository }) {
		this.userRepository = userRepository;
		this.billingRepository = billingRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ViewBillingInput ? inputDto : new ViewBillingInput(inputDto ?? {});

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		if (!adminUser || adminUser.role !== 'admin') {
			throw new DomainError('Access denied. Admin role required.');
		}

		const pageInput = input.page;
		const pageSizeInput = input.pageSize;
		const page = pageInput === undefined || pageInput === null || pageInput === '' ? 1 : Number(pageInput);
		const pageSize = pageSizeInput === undefined || pageSizeInput === null || pageSizeInput === '' ? 20 : Number(pageSizeInput);
		if (!Number.isFinite(page) || !Number.isFinite(pageSize) || page <= 0 || pageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}

		const listed = await this.billingRepository.list({
			status: input.status,
			patientId: input.patientId,
			page,
			pageSize,
		});
		const items = Array.isArray(listed?.items) ? listed.items : [];

		return new ViewBillingOutput({
			billings: items,
			page: Number(listed?.page) || Math.floor(page),
			pageSize: Number(listed?.pageSize) || Math.floor(pageSize),
			total: Number(listed?.total) || items.length,
		});
	}
}
