import { SettingsRepositoryPort } from '../../application/ports/repositories/settingsRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class SettingsRepositoryAdapter extends SettingsRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async getSettings() { return toPlain(await this.inner.getSettings()); }
  async save(settings) { return toPlain(await this.inner.save(settings)); }
}
