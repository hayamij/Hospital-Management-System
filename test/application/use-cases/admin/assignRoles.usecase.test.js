import assert from 'node:assert';
import { AssignRolesUseCase } from '../../../../server/application/use-cases/admin/assignRoles.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeUserRepository {
  constructor(users) {
    this.users = users;
    this.savedUser = null;
  }
  async findById(id) {
    return this.users[id] ?? null;
  }
  async save(user) {
    this.savedUser = user;
    this.users[user.id] = user;
  }
}

const admin = { id: 'admin-1', role: 'admin' };
const user = { id: 'user-1', roles: ['patient'] };

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
    () => new AssignRolesUseCase({ userRepository: new FakeUserRepository({}) }).execute({ userId: 'u1', role: 'doctor' }),
    'Admin id is required.',
  );

  // Missing userId
  await expectThrows(
    () => new AssignRolesUseCase({ userRepository: new FakeUserRepository({}) }).execute({ adminId: 'a1', role: 'doctor' }),
    'User id is required.',
  );

  // Missing role
  await expectThrows(
    () => new AssignRolesUseCase({ userRepository: new FakeUserRepository({}) }).execute({ adminId: 'a1', userId: 'u1' }),
    'Role is required.',
  );

  // Admin without admin role
  await expectThrows(
    () => new AssignRolesUseCase({ userRepository: new FakeUserRepository({ 'not-admin': { id: 'not-admin', role: 'doctor' }, 'user-1': user }) }).execute({ adminId: 'not-admin', userId: 'user-1', role: 'nurse' }),
    'Access denied. Admin role required.',
  );

  // User not found
  await expectThrows(
    () => new AssignRolesUseCase({ userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, userId: 'missing', role: 'nurse' }),
    'User not found.',
  );

  // Success: role appended and saved
  const repo = new FakeUserRepository({ [admin.id]: admin, [user.id]: { ...user } });
  const usecase = new AssignRolesUseCase({ userRepository: repo });
  const result = await usecase.execute({ adminId: admin.id, userId: user.id, role: 'doctor' });
  assert.strictEqual(result.userId, user.id);
  assert.strictEqual(result.role, 'doctor');
  assert.ok(repo.users[user.id].roles.includes('doctor'));
  assert.ok(repo.savedUser === repo.users[user.id]);
}

wrapLegacyRun(run, 'assignRoles.usecase');

