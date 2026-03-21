export class AuditMedicalRecordsInput {
	constructor({ adminId, recordId, action, reason }) {
		this.adminId = adminId;
		this.recordId = recordId;
		this.action = action; // e.g., 'view', 'edit', 'approve', 'reject'
		this.reason = reason;
	}
}
