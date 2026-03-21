import assert from 'node:assert';
import { BrowsePublicInfoUseCase } from '../../../../src/application/use-cases/guest/browsePublicInfo.usecase.js';

class FakeServiceCatalogRepository {
  constructor(services) {
    this.services = services;
  }
  async listServices() {
    return this.services;
  }
}

class FakeSettingsRepository {
  constructor(settings) {
    this.settings = settings;
  }
  async getSettings() {
    return this.settings;
  }
}

async function run() {
  // Happy path with services and settings
  {
    const usecase = new BrowsePublicInfoUseCase({
      serviceCatalogRepository: new FakeServiceCatalogRepository([{ id: 1, name: 'X-ray' }]),
      settingsRepository: new FakeSettingsRepository({ name: 'City Hospital', address: '123 Street' }),
    });
    const result = await usecase.execute();
    assert.deepStrictEqual(result.services, [{ id: 1, name: 'X-ray' }]);
    assert.deepStrictEqual(result.hospitalInfo, { name: 'City Hospital', address: '123 Street' });
  }

  // No services/settings returns defaults
  {
    const usecase = new BrowsePublicInfoUseCase({
      serviceCatalogRepository: new FakeServiceCatalogRepository(null),
      settingsRepository: new FakeSettingsRepository(undefined),
    });
    const result = await usecase.execute();
    assert.deepStrictEqual(result.services, []);
    assert.deepStrictEqual(result.hospitalInfo, {});
  }
}

run()
  .then(() => console.log('browsePublicInfo.usecase tests passed'))
  .catch((err) => {
    console.error('browsePublicInfo.usecase tests failed', err);
    process.exit(1);
  });
