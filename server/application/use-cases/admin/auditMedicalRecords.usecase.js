import { DomainError } from '../../../domain/exceptions/domainError.js';
import { AuditMedicalRecordsInput } from '../../dto/admin/auditMedicalRecordsInput.js';
import { AuditMedicalRecordsOutput } from '../../dto/admin/auditMedicalRecordsOutput.js';

export class AuditMedicalRecordsUseCase {
	constructor({ medicalRecordRepository, auditLogRepository, userRepository }) {
		this.medicalRecordRepository = medicalRecordRepository;
		this.auditLogRepository = auditLogRepository;
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof AuditMedicalRecordsInput ? inputDto : new AuditMedicalRecordsInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.recordId) {
			throw new DomainError('Record id is required.');
		}
		if (!input.action || !String(input.action).trim()) {
			throw new DomainError('Action is required.');
		}
		if (!input.reason || !String(input.reason).trim()) {
			throw new DomainError('Reason is required.');
		}

		const adminUser = await this.userRepository.findById?.(input.adminId) || null;
		if (!adminUser || adminUser.role !== 'admin') {
			throw new DomainError('Access denied. Admin role required.');
		}

		const record = await this.medicalRecordRepository.findById(input.recordId);
		if (!record) {
			throw new DomainError('Medical record not found.');
		}

		const auditedAt = new Date();

		await this.auditLogRepository.append({
			recordId: input.recordId,
			adminId: input.adminId,
			action: input.action,
			reason: input.reason,
			auditedAt,
		});

		return new AuditMedicalRecordsOutput({
			recordId: input.recordId,
			action: input.action,
			auditedAt,
			adminId: input.adminId,
		});
	}
}
