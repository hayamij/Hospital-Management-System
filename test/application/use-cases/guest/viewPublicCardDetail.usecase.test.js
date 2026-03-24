import assert from 'node:assert';
import { ViewPublicCardDetailUseCase } from '../../../../src/application/use-cases/guest/viewPublicCardDetail.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeServiceCatalogRepository {
  constructor({ services = {}, plans = {}, constraints = {} } = {}) {
    this.services = services;
    this.plans = plans;
    this.constraints = constraints;
  }

  async findServiceById(id) {
    return this.services[id] ?? null;
  }

  async findInsurancePlanById(id) {
    return this.plans[id] ?? null;
  }

  async findBookingConstraintById(id) {
    return this.constraints[id] ?? null;
  }
}

class FakeDoctorRepository {
  constructor(doctors = {}) {
    this.doctors = doctors;
  }

  async findById(id) {
    return this.doctors[id] ?? null;
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
  const useCase = new ViewPublicCardDetailUseCase({
    serviceCatalogRepository: new FakeServiceCatalogRepository({
      services: { 'svc-1': { id: 'svc-1', name: 'X-ray', price: 250, description: 'Imaging service' } },
      plans: {
        'plan-1': {
          id: 'plan-1',
          planName: 'Basic Plan',
          provider: 'ABC Insurance',
          coverageSummary: 'Up to 70%',
          copayAmount: 50,
        },
      },
      constraints: {
        'bc-1': {
          id: 'bc-1',
          code: 'ADV_BOOK',
          title: 'Advance booking',
          description: 'Book at least 24h in advance',
          appliesToRole: 'patient',
          value: '24h',
        },
      },
    }),
    doctorRepository: new FakeDoctorRepository({
      'doc-1': {
        id: 'doc-1',
        fullName: 'Dr. Demo',
        specialization: 'General',
        department: 'Outpatient',
        availableSlotsPerDay: 8,
        status: 'active',
      },
    }),
  });

  await expectThrows(
    () => useCase.execute({ category: 'invalid', itemId: 'x' }),
    'Invalid category for public card detail.',
  );

  await expectThrows(
    () => useCase.execute({ category: 'services' }),
    'itemId is required.',
  );

  const serviceResult = await useCase.execute({ category: 'services', itemId: 'svc-1' });
  assert.strictEqual(serviceResult.category, 'services');
  assert.strictEqual(serviceResult.item.name, 'X-ray');

  const planResult = await useCase.execute({ category: 'insurance-plans', itemId: 'plan-1' });
  assert.strictEqual(planResult.item.planName, 'Basic Plan');

  const constraintResult = await useCase.execute({ category: 'booking-constraints', itemId: 'bc-1' });
  assert.strictEqual(constraintResult.item.code, 'ADV_BOOK');

  const doctorResult = await useCase.execute({ category: 'doctors', itemId: 'doc-1' });
  assert.strictEqual(doctorResult.item.fullName, 'Dr. Demo');

  const missingResult = await useCase.execute({ category: 'doctors', itemId: 'doc-missing' });
  assert.strictEqual(missingResult.item, null);
}

wrapLegacyRun(run, 'viewPublicCardDetail.usecase');
