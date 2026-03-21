// Port for writing audit logs.
export class AuditLogRepositoryPort {
	async append(entry) {
		throw new Error('AuditLogRepositoryPort.append not implemented');
	}
}
