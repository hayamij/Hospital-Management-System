export class RunReportsInput {
	constructor({ adminId, reportName, params }) {
		this.adminId = adminId;
		this.reportName = reportName;
		this.params = params;
	}
}
