export class ConfigureServicesAndPricingOutput {
	constructor({ serviceId, action, services = [], page = 1, pageSize = 10, total = 0 }) {
		this.serviceId = serviceId;
		this.action = action;
		this.services = services;
		this.page = page;
		this.pageSize = pageSize;
		this.total = total;
	}
}
