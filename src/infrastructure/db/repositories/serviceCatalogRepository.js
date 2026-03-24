import crypto from 'node:crypto';
import { ServiceCatalogRepositoryPort } from '../../../application/ports/repositories/serviceCatalogRepositoryPort.js';

const ensureId = (id) => id || crypto.randomUUID();

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description ?? 'Service available via clinic workflow.',
  };
};

const toInsurancePlanEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    planName: row.plan_name,
    coverageSummary: row.coverage_summary,
    copayAmount: row.copay_amount,
  };
};

const toBookingConstraintEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    appliesToRole: row.applies_to_role,
    value: row.constraint_value,
  };
};

export class SqlServiceCatalogRepository extends ServiceCatalogRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async upsertService(service) {
    const id = ensureId(service.id);
    const existing = await this.findById(id);
    if (existing) {
      await this.pool.query('UPDATE services SET name = $1, price = $2 WHERE id = $3', [service.name, service.price ?? 0, id]);
      return this.findById(id);
    }
    await this.pool.query('INSERT INTO services (id, name, price) VALUES ($1,$2,$3)', [id, service.name, service.price ?? 0]);
    return this.findById(id);
  }

  async removeService(serviceId) {
    await this.pool.query('DELETE FROM services WHERE id = $1', [serviceId]);
  }

  async listServices() {
    const { rows } = await this.pool.query('SELECT * FROM services ORDER BY name ASC');
    return rows.map(toEntity);
  }

  async listInsurancePlans() {
    const { rows } = await this.pool.query(
      'SELECT * FROM insurance_plans ORDER BY provider ASC, plan_name ASC',
    );
    return rows.map(toInsurancePlanEntity);
  }

  async listBookingConstraints() {
    const { rows } = await this.pool.query(
      'SELECT * FROM booking_constraints ORDER BY code ASC',
    );
    return rows.map(toBookingConstraintEntity);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM services WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async findServiceById(serviceId) {
    return this.findById(serviceId);
  }

  async findInsurancePlanById(planId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM insurance_plans WHERE id = $1 LIMIT 1',
      [planId],
    );
    return toInsurancePlanEntity(rows[0]);
  }

  async findBookingConstraintById(constraintId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM booking_constraints WHERE id = $1 LIMIT 1',
      [constraintId],
    );
    return toBookingConstraintEntity(rows[0]);
  }
}
