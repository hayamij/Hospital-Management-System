export class ViewMedicalRecordsInput {
	constructor({ patientId, page = 1, pageSize = 20 }) {
		this.patientId = patientId;
		this.page = page;
		this.pageSize = pageSize;
	}
}
