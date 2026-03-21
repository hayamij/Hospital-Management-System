import assert from 'node:assert';
import { ConfigureServicesAndPricingUseCase } from '../../../../src/application/use-cases/admin/configureServicesAndPricing.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeServiceCatalogRepository {
  constructor() {
    this.upserted = null;
    this.removedId = null;
  }
  async upsertService(service) {
    this.upserted = service;
  }
  async removeService(id) {
    this.removedId = id;
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
    () => new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository(), userRepository: new FakeUserRepository({}) }).execute({ action: 'upsert', service: { name: 'MRI', price: 100 } }),
    'Admin id is required.',
  );

  // Missing action
  await expectThrows(
    () => new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository(), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, service: { name: 'MRI', price: 100 } }),
    'Action is required.',
  );

  // Invalid action
  await expectThrows(
    () => new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository(), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, action: 'unknown' }),
    'Invalid service catalog action.',
  );

  // Non-admin user
  await expectThrows(
    () => new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository(), userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'patient' } }) }).execute({ adminId: admin.id, action: 'upsert', service: { name: 'MRI', price: 100 } }),
    'Access denied. Admin role required.',
  );

  // Remove without id
  await expectThrows(
    () => new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository(), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, action: 'remove', service: {} }),
    'Service id is required to remove.',
  );

  // Upsert missing name
  await expectThrows(
    () => new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository(), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, action: 'upsert', service: { price: 100 } }),
    'Service name is required to upsert.',
  );

  // Upsert invalid price
  await expectThrows(
    () => new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository(), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, action: 'upsert', service: { name: 'MRI', price: -1 } }),
    'Service price must be a non-negative number.',
  );

  // Success remove
  const catalogRepo = new FakeServiceCatalogRepository();
  const removeResult = await new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: catalogRepo, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, action: 'remove', service: { id: 'svc-1' } });
  assert.strictEqual(removeResult.action, 'remove');
  assert.strictEqual(removeResult.serviceId, 'svc-1');
  assert.strictEqual(catalogRepo.removedId, 'svc-1');

  // Success upsert
  const upsertRepo = new FakeServiceCatalogRepository();
  const upsertResult = await new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository: upsertRepo, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, action: 'upsert', service: { id: 'svc-2', name: ' MRI ', price: '150.5' } });
  assert.strictEqual(upsertResult.action, 'upsert');
  assert.strictEqual(upsertResult.serviceId, 'svc-2');
  assert.deepStrictEqual(upsertRepo.upserted, { id: 'svc-2', name: 'MRI', price: 150.5 });
}

wrapLegacyRun(run, 'configureServicesAndPricing.usecase');

