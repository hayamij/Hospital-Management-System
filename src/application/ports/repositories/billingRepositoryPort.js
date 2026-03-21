// Port for billing persistence operations.
export class BillingRepositoryPort {
	async findById(invoiceId) {
		throw new Error('BillingRepositoryPort.findById not implemented');
	}

	async save(billing) {
		throw new Error('BillingRepositoryPort.save not implemented');
	}
	async listByPatient(patientId) {
		throw new Error('BillingRepositoryPort.listByPatient not implemented');
	}
}
