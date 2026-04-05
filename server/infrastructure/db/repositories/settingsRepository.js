import { SettingsRepositoryPort } from '../../../application/ports/repositories/settingsRepositoryPort.js';

const SETTINGS_ID = 'singleton';

const safeJsonParse = (value) => {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isPlainObject = (value) =>
  value != null && typeof value === 'object' && !Array.isArray(value);

export class SqlSettingsRepository extends SettingsRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async getSettings() {
    const { rows } = await this.pool.query('SELECT id, data FROM settings ORDER BY id ASC');
    if (!rows.length) return null;

    const merged = {};
    for (const row of rows) {
      const parsed = safeJsonParse(row.data);
      if (row.id === SETTINGS_ID && isPlainObject(parsed)) {
        Object.assign(merged, parsed);
      } else {
        merged[row.id] = parsed;
      }
    }

    return merged;
  }

  async save(settings) {
    const payload = typeof settings === 'string' ? settings : JSON.stringify(settings ?? {});
    const existingSingleton = await this.pool.query(
      'SELECT id FROM settings WHERE id = $1 LIMIT 1',
      [SETTINGS_ID]
    );
    if (existingSingleton.rows?.length) {
      await this.pool.query('UPDATE settings SET data = $1, updated_at = now() WHERE id = $2', [payload, SETTINGS_ID]);
      return this.getSettings();
    }
    await this.pool.query('INSERT INTO settings (id, data) VALUES ($1,$2)', [SETTINGS_ID, payload]);
    return this.getSettings();
  }
}
