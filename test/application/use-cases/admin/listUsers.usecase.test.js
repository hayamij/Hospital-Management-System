import assert from 'node:assert';
import { ListUsersUseCase } from '../../../../src/application/use-cases/admin/listUsers.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
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
      total: 1,
      items: [{ id: 'u1', fullName: 'User 1', email: 'u1@example.com', role: 'patient', status: 'active' }],
    },
  });

  const result = await new ListUsersUseCase({ userRepository: repo }).execute({ adminId: 'admin1', query: 'u1', type: 'patient', page: 2, pageSize: 5 });
  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.users[0].id, 'u1');
  assert.strictEqual(repo.lastListInput.role, 'patient');
}

wrapLegacyRun(run, 'listUsers.usecase');
