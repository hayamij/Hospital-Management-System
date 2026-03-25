import assert from 'node:assert';
import { ViewPublicServiceDetailUseCase } from '../../../../server/application/use-cases/guest/viewPublicServiceDetail.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeServiceCatalogRepository {
  constructor(services = {}) {
    this.services = services;
  }

  async findServiceById(id) {
    return this.services[id] ?? null;
  }
}

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
  await expectThrows(
    () => new ViewPublicServiceDetailUseCase({ serviceCatalogRepository: new FakeServiceCatalogRepository() }).execute({}),
    'serviceId is required.',
  );

  const missing = await new ViewPublicServiceDetailUseCase({
    serviceCatalogRepository: new FakeServiceCatalogRepository({}),
  }).execute({ serviceId: 'svc-missing' });

  assert.strictEqual(missing.service, null);

  const found = await new ViewPublicServiceDetailUseCase({
    serviceCatalogRepository: new FakeServiceCatalogRepository({
      'svc-1': { id: 'svc-1', name: 'General Checkup', price: 300, description: 'Basic health check.' },
    }),
  }).execute({ serviceId: 'svc-1' });

  assert.deepStrictEqual(found.service, {
    id: 'svc-1',
    name: 'General Checkup',
    price: 300,
    description: 'Basic health check.',
  });
}

wrapLegacyRun(run, 'viewPublicServiceDetail.usecase');
