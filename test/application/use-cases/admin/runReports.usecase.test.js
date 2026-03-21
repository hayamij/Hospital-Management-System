import assert from 'node:assert';
import { RunReportsUseCase } from '../../../../src/application/use-cases/admin/runReports.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeReportRepository {
  constructor() {
    this.last = null;
  }
  async run(name, params) {
    this.last = { name, params };
    return { rows: 2 };
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
    () => new RunReportsUseCase({ reportRepository: new FakeReportRepository(), userRepository: new FakeUserRepository({}) }).execute({ reportName: 'usage' }),
    'Admin id is required.',
  );

  // Missing report name
  await expectThrows(
    () => new RunReportsUseCase({ reportRepository: new FakeReportRepository(), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id }),
    'Report name is required.',
  );

  // Non-admin user
  await expectThrows(
    () => new RunReportsUseCase({ reportRepository: new FakeReportRepository(), userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'patient' } }) }).execute({ adminId: admin.id, reportName: 'usage' }),
    'Access denied. Admin role required.',
  );

  // Success
  const repo = new FakeReportRepository();
  const result = await new RunReportsUseCase({ reportRepository: repo, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, reportName: 'usage', params: { month: 'Jan' } });
  assert.strictEqual(result.reportName, 'usage');
  assert.deepStrictEqual(repo.last, { name: 'usage', params: { month: 'Jan' } });
  assert.deepStrictEqual(result.data, { rows: 2 });
}

run()
  .then(() => console.log('runReports.usecase tests passed'))
  .catch((err) => {
    console.error('runReports.usecase tests failed', err);
    process.exit(1);
  });
