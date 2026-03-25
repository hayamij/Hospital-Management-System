export class SearchDoctorsInput {
	constructor({ query, specialty, page = 1, pageSize = 20 }) {
		this.query = query;
		this.specialty = specialty;
		this.page = page;
		this.pageSize = pageSize;
	}
}
