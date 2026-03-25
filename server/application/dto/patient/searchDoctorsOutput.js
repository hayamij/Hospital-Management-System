export class SearchDoctorsOutput {
	constructor({ doctors, page, pageSize, total }) {
		this.doctors = doctors;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
