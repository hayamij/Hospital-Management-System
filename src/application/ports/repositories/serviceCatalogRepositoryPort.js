// Port for service catalog operations (services, pricing, insurance plans).
export class ServiceCatalogRepositoryPort {
	async upsertService(service) {
		throw new Error('ServiceCatalogRepositoryPort.upsertService not implemented');
	}

	async removeService(serviceId) {
		throw new Error('ServiceCatalogRepositoryPort.removeService not implemented');
	}
}
