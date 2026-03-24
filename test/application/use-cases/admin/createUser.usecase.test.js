import assert from 'node:assert';
import { CreateUserUseCase } from '../../../../src/application/use-cases/admin/createUser.usecase.js';
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
    this.saved = { ...user, id: user.id || 'u-new', createdAt: '2026-04-01T00:00:00Z' };
    return this.saved;
  }
}

const fakeAuthService = {
  async hashPassword(plain) {
    return `hashed:${plain}`;
  },
};

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
    () => new CreateUserUseCase({ userRepository: new FakeUserRepository(), authService: fakeAuthService }).execute({}),
    'Admin id is required.',
  );

  await expectThrows(
    () => new CreateUserUseCase({ userRepository: new FakeUserRepository({ byId: { a1: { id: 'a1', role: 'doctor' } } }), authService: fakeAuthService }).execute({ adminId: 'a1' }),
    'Access denied. Admin role required.',
  );

  const repoExists = new FakeUserRepository({
    byId: { admin1: { id: 'admin1', role: 'admin' } },
    byEmail: { 'dup@example.com': { id: 'u1', email: 'dup@example.com' } },
  });
  await expectThrows(
    () => new CreateUserUseCase({ userRepository: repoExists, authService: fakeAuthService }).execute({ adminId: 'admin1', fullName: 'Dup', email: 'dup@example.com', role: 'patient' }),
    'Email already exists.',
  );

  const repo = new FakeUserRepository({ byId: { admin1: { id: 'admin1', role: 'admin' } } });
  const result = await new CreateUserUseCase({ userRepository: repo, authService: fakeAuthService }).execute({
    adminId: 'admin1',
    fullName: 'User 2',
    email: 'user2@example.com',
    role: 'doctor',
    status: 'active',
    password: 'secret123',
  });

  assert.strictEqual(result.userId, 'u-new');
  assert.strictEqual(repo.saved.passwordHash, 'hashed:secret123');
}

wrapLegacyRun(run, 'createUser.usecase');
