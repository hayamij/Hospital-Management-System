export class AuditMedicalRecordsOutput {
	constructor({ recordId, action, auditedAt, adminId }) {
		this.recordId = recordId;
		this.action = action;
		this.auditedAt = auditedAt;
		this.adminId = adminId;
	}
}
