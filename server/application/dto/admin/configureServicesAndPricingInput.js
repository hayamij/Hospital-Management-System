export class ConfigureServicesAndPricingInput {
	constructor({ adminId, service, action, query, page = 1, pageSize = 10 }) {
		this.adminId = adminId;
		this.service = service; // { id, name, price }
		this.action = action; // 'upsert' | 'remove' | 'list'
		this.query = query;
		this.page = page;
		this.pageSize = pageSize;
	}
}
