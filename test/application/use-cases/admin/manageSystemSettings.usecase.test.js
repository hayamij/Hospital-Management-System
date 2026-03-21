import assert from 'node:assert';
import { ManageSystemSettingsUseCase } from '../../../../src/application/use-cases/admin/manageSystemSettings.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeSettingsRepository {
  constructor(settings) {
    this.settings = settings;
    this.saved = null;
  }
  async getSettings() {
    return this.settings;
  }
  async save(newSettings) {
    this.saved = newSettings;
    this.settings = newSettings;
  }
}

class FakeUserRepository {
  constructor(users) {
    this.users = users;
  }
  async findById(id) {
    return this.users[id] ?? null;
  }
}

const admin = { id: 'admin-1', role: 'admin' };

async function expectThrows(fn, message) {
  let threw = false;
  try {
    await fn();
  } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError, 'Expected DomainError');
    if (message) {
      assert.strictEqual(err.message, message);
    }
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  // Missing adminId
  await expectThrows(
    () => new ManageSystemSettingsUseCase({ settingsRepository: new FakeSettingsRepository({}), userRepository: new FakeUserRepository({}) }).execute({ settings: { maintenanceMode: true } }),
    'Admin id is required.',
  );

  // Missing settings
  await expectThrows(
    () => new ManageSystemSettingsUseCase({ settingsRepository: new FakeSettingsRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id }),
    'Settings payload is required.',
  );

  // Non-admin user
  await expectThrows(
    () => new ManageSystemSettingsUseCase({ settingsRepository: new FakeSettingsRepository({}), userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'patient' } }) }).execute({ adminId: admin.id, settings: { maintenanceMode: true } }),
    'Access denied. Admin role required.',
  );

  // Success merge and save
  const repo = new FakeSettingsRepository({ maintenanceMode: false, timezone: 'UTC' });
  const result = await new ManageSystemSettingsUseCase({ settingsRepository: repo, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, settings: { timezone: 'PST', featureFlag: true } });
  assert.strictEqual(result.success, true);
  assert.strictEqual(repo.saved.timezone, 'PST');
  assert.strictEqual(repo.saved.maintenanceMode, false);
  assert.strictEqual(repo.saved.featureFlag, true);
  assert.strictEqual(result.error, null);
}

wrapLegacyRun(run, 'manageSystemSettings.usecase');

