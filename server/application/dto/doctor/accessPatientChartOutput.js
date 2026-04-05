export class AccessPatientChartOutput {
	constructor({ patientId, entries, recordId = null, recordCreatedAt = null, hasRecord = false }) {
		this.patientId = patientId;
		this.entries = entries;
		this.recordId = recordId;
		this.recordCreatedAt = recordCreatedAt;
		this.hasRecord = Boolean(hasRecord || recordId);
	}
}
