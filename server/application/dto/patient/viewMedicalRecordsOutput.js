export class ViewMedicalRecordsOutput {
	constructor({ records, page, pageSize, total, hasRecord = false, recordId = null, recordCreatedAt = null }) {
		this.records = records;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
		this.hasRecord = hasRecord;
		this.recordId = recordId;
		this.recordCreatedAt = recordCreatedAt;
	}
}
