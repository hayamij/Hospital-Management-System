// Port for managing contact/lead submissions (guest to admin).
export class ContactLeadRepositoryPort {
	async listPending() {
		throw new Error('ContactLeadRepositoryPort.listPending not implemented');
	}

	async create(lead) {
		throw new Error('ContactLeadRepositoryPort.create not implemented');
	}
}
