import crypto from 'node:crypto';
import { ContactLeadRepositoryPort } from '../../../application/ports/repositories/contactLeadRepositoryPort.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    receivedAt: toDate(row.received_at),
  };
};

export class SqlContactLeadRepository extends ContactLeadRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async listPending() {
    const { rows } = await this.pool.query('SELECT * FROM contact_leads ORDER BY received_at DESC');
    return rows.map(toEntity);
  }

  async create(lead) {
    const id = ensureId(lead.id);
    await this.pool.query(
      `INSERT INTO contact_leads (id, name, email, message)
       VALUES ($1,$2,$3,$4)`,
      [id, lead.name ?? null, lead.email ?? null, lead.message ?? null],
    );
    return this.findById(id);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM contact_leads WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }
}
