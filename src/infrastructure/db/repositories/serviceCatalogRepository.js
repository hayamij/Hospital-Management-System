import { ServiceCatalogRepositoryPort } from '../../../application/ports/repositories/serviceCatalogRepositoryPort.js';

// SQL repository stub for service catalog.
export class SqlServiceCatalogRepository extends ServiceCatalogRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async upsertService(service) {
    throw new Error('SqlServiceCatalogRepository.upsertService not implemented');
  }

  async removeService(serviceId) {
    throw new Error('SqlServiceCatalogRepository.removeService not implemented');
  }

  async listServices() {
    throw new Error('SqlServiceCatalogRepository.listServices not implemented');
  }
}
