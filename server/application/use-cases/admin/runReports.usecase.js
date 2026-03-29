import { DomainError } from '../../../domain/exceptions/domainError.js';
import { RunReportsInput } from '../../dto/admin/runReportsInput.js';
import { RunReportsOutput } from '../../dto/admin/runReportsOutput.js';

export class RunReportsUseCase {
	constructor({ reportRepository, userRepository }) {
		this.reportRepository = reportRepository;
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof RunReportsInput ? inputDto : new RunReportsInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.reportName || !String(input.reportName).trim()) {
			throw new DomainError('Report name is required.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		const hasAdminRole = adminUser?.role === 'admin' || Array.isArray(adminUser?.roles) && adminUser.roles.includes('admin');
		if (!adminUser || !hasAdminRole) {
			throw new DomainError('Access denied. Admin role required.');
		}

		const data = await this.reportRepository.run(input.reportName, input.params ?? {});

		return new RunReportsOutput({ reportName: input.reportName, data });
	}
}
