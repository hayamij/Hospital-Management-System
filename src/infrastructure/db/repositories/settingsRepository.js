import { SettingsRepositoryPort } from '../../../application/ports/repositories/settingsRepositoryPort.js';

const SETTINGS_ID = 'singleton';

export class SqlSettingsRepository extends SettingsRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async getSettings() {
    const { rows } = await this.pool.query('SELECT * FROM settings WHERE id = $1 LIMIT 1', [SETTINGS_ID]);
    const row = rows[0];
    if (!row) return null;
    return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  }

  async save(settings) {
    const payload = typeof settings === 'string' ? settings : JSON.stringify(settings ?? {});
    const existing = await this.getSettings();
    if (existing) {
      await this.pool.query('UPDATE settings SET data = $1, updated_at = now() WHERE id = $2', [payload, SETTINGS_ID]);
      return this.getSettings();
    }
    await this.pool.query('INSERT INTO settings (id, data) VALUES ($1,$2)', [SETTINGS_ID, payload]);
    return this.getSettings();
  }
}
