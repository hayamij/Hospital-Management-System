import assert from 'node:assert';
import { ListUsersUseCase } from '../../../../server/application/use-cases/admin/listUsers.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeUserRepository {
  constructor({ usersById = {}, listResult = { total: 0, items: [] } } = {}) {
    this.usersById = usersById;
    this.listResult = listResult;
    this.lastListInput = null;
  }

  async findById(id) {
    return this.usersById[id] ?? null;
  }

  async list(input) {
    this.lastListInput = input;
    return this.listResult;
  }
}

class FakeProfileRepository {
  constructor(itemsById = {}) {
    this.itemsById = itemsById;
  }

  async findById(id) {
    return this.itemsById[id] ?? null;
  }
}

async function expectThrows(fn, message) {
  let threw = false;
  try {
    await fn();
  } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError, 'Expected DomainError');
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  await expectThrows(
    () => new ListUsersUseCase({ userRepository: new FakeUserRepository() }).execute({}),
    'Admin id is required.',
  );

  await expectThrows(
    () => new ListUsersUseCase({ userRepository: new FakeUserRepository({ usersById: { a1: { id: 'a1', role: 'doctor' } } }) }).execute({ adminId: 'a1' }),
    'Access denied. Admin role required.',
  );

  const repo = new FakeUserRepository({
    usersById: { admin1: { id: 'admin1', role: 'admin' } },
    listResult: {
      total: 2,
      items: [
        {
          id: 'u1',
          fullName: 'Old Doctor Name',
          email: 'u1@example.com',
          role: 'doctor',
          status: 'active',
          doctorId: 'doc-1',
        },
        {
          id: 'u2',
          fullName: 'Old Patient Name',
          email: 'u2@example.com',
          role: 'patient',
          status: 'active',
          patientId: 'pat-1',
        },
      ],
    },
  });

  const doctorRepository = new FakeProfileRepository({
    'doc-1': { id: 'doc-1', fullName: 'Dr. Updated Name' },
  });

  const patientRepository = new FakeProfileRepository({
    'pat-1': { id: 'pat-1', fullName: 'Patient Updated Name' },
  });

  const useCase = new ListUsersUseCase({
    userRepository: repo,
    doctorRepository,
    patientRepository,
  });

  const result = await useCase.execute({ adminId: 'admin1', query: 'u1', role: 'patient', page: 2, pageSize: 5 });
  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.users[0].id, 'u1');
  assert.strictEqual(result.users[0].fullName, 'Dr. Updated Name');
  assert.strictEqual(result.users[1].fullName, 'Patient Updated Name');
  assert.strictEqual(repo.lastListInput.role, 'patient');

  await useCase.execute({ adminId: 'admin1', type: 'doctor' });
  assert.strictEqual(repo.lastListInput.role, 'doctor');
}

wrapLegacyRun(run, 'listUsers.usecase');
