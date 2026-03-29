// Port for service catalog operations (services, pricing, insurance plans).
export class ServiceCatalogRepositoryPort {
	async upsertService(service) {
		throw new Error('ServiceCatalogRepositoryPort.upsertService not implemented');
	}

	async removeService(serviceId) {
		throw new Error('ServiceCatalogRepositoryPort.removeService not implemented');
	}

	async listServices() {
		throw new Error('ServiceCatalogRepositoryPort.listServices not implemented');
	}

	async listInsurancePlans() {
		throw new Error('ServiceCatalogRepositoryPort.listInsurancePlans not implemented');
	}

	async listBookingConstraints() {
		throw new Error('ServiceCatalogRepositoryPort.listBookingConstraints not implemented');
	}

	async findServiceById(serviceId) {
		throw new Error('ServiceCatalogRepositoryPort.findServiceById not implemented');
	}

	async findInsurancePlanById(planId) {
		throw new Error('ServiceCatalogRepositoryPort.findInsurancePlanById not implemented');
	}

	async findBookingConstraintById(constraintId) {
		throw new Error('ServiceCatalogRepositoryPort.findBookingConstraintById not implemented');
	}
}
