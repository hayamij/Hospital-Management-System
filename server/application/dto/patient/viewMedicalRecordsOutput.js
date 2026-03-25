export class ViewMedicalRecordsOutput {
	constructor({ records, page, pageSize, total }) {
		this.records = records;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
