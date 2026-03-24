import { ServiceCatalogRepositoryPort } from '../../application/ports/repositories/serviceCatalogRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class ServiceCatalogRepositoryAdapter extends ServiceCatalogRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async upsertService(service) { return toPlain(await this.inner.upsertService(service)); }
  async removeService(serviceId) { return toPlain(await this.inner.removeService(serviceId)); }
  async listServices() { return toPlain(await this.inner.listServices()); }
  async listInsurancePlans() { return toPlain(await this.inner.listInsurancePlans()); }
  async listBookingConstraints() { return toPlain(await this.inner.listBookingConstraints()); }
  async findServiceById(serviceId) { return toPlain(await this.inner.findServiceById(serviceId)); }
}
