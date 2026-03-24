import assert from 'node:assert';
import { UpdateUserUseCase } from '../../../../src/application/use-cases/admin/updateUser.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeUserRepository {
  constructor({ byId = {}, byEmail = {} } = {}) {
    this.byId = byId;
    this.byEmail = byEmail;
    this.saved = null;
  }

  async findById(id) {
    return this.byId[id] ?? null;
  }

  async findByEmail(email) {
    return this.byEmail[email] ?? null;
  }

  async save(user) {
    this.saved = { ...user, updatedAt: '2026-04-01T10:00:00Z' };
    this.byId[user.id] = this.saved;
    return this.saved;
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
    () => new UpdateUserUseCase({ userRepository: new FakeUserRepository() }).execute({ userId: 'u1' }),
    'Admin id is required.',
  );

  await expectThrows(
    () => new UpdateUserUseCase({ userRepository: new FakeUserRepository() }).execute({ adminId: 'a1' }),
    'User id is required.',
  );

  await expectThrows(
    () => new UpdateUserUseCase({ userRepository: new FakeUserRepository({ byId: { a1: { id: 'a1', role: 'patient' } } }) }).execute({ adminId: 'a1', userId: 'u1' }),
    'Access denied. Admin role required.',
  );

  await expectThrows(
    () => new UpdateUserUseCase({ userRepository: new FakeUserRepository({ byId: { admin1: { id: 'admin1', role: 'admin' } } }) }).execute({ adminId: 'admin1', userId: 'missing' }),
    'User not found.',
  );

  const repo = new FakeUserRepository({
    byId: {
      admin1: { id: 'admin1', role: 'admin' },
      u1: { id: 'u1', fullName: 'User One', email: 'u1@example.com', role: 'patient', status: 'active' },
    },
  });

  const result = await new UpdateUserUseCase({ userRepository: repo }).execute({
    adminId: 'admin1',
    userId: 'u1',
    fullName: 'User One Updated',
    email: 'u1@example.com',
    role: 'doctor',
    status: 'inactive',
  });

  assert.strictEqual(result.userId, 'u1');
  assert.strictEqual(result.role, 'doctor');
  assert.strictEqual(repo.saved.status, 'inactive');
}

wrapLegacyRun(run, 'updateUser.usecase');
