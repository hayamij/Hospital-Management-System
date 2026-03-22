import { SettingsRepositoryPort } from '../../../application/ports/repositories/settingsRepositoryPort.js';

// SQL repository stub for system settings.
export class SqlSettingsRepository extends SettingsRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async getSettings() {
    throw new Error('SqlSettingsRepository.getSettings not implemented');
  }

  async save(settings) {
    throw new Error('SqlSettingsRepository.save not implemented');
  }
}
