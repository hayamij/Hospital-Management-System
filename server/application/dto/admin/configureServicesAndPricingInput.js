export class ConfigureServicesAndPricingInput {
	constructor({ adminId, service, action }) {
		this.adminId = adminId;
		this.service = service; // { id, name, price }
		this.action = action; // 'upsert' | 'remove'
	}
}
