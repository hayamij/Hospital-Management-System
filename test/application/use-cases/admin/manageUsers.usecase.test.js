import assert from 'node:assert';
import { ManageUsersUseCase } from '../../../../src/application/use-cases/admin/manageUsers.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeUser {
  constructor(id) {
    this.id = id;
    this.status = 'pending';
  }
  setStatus(status) {
    this.status = status;
  }
  activate() {
    this.status = 'active';
  }
  deactivate() {
    this.status = 'disabled';
  }
}

class FakeUserRepository {
  constructor(users) {
    this.users = users;
    this.saved = null;
  }
  async findById(id) {
    return this.users[id] ?? null;
  }
  async save(user) {
    this.saved = user;
    this.users[user.id] = user;
  }
}

const admin = { id: 'admin-1', role: 'admin' };
const targetUser = new FakeUser('user-1');

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
    () => new ManageUsersUseCase({ userRepository: new FakeUserRepository({}) }).execute({ userId: targetUser.id, action: 'verify' }),
    'Admin id is required.',
  );

  // Missing userId
  await expectThrows(
    () => new ManageUsersUseCase({ userRepository: new FakeUserRepository({}) }).execute({ adminId: admin.id, action: 'verify' }),
    'User id is required.',
  );

  // Invalid action
  await expectThrows(
    () => new ManageUsersUseCase({ userRepository: new FakeUserRepository({}) }).execute({ adminId: admin.id, userId: targetUser.id, action: 'x' }),
    'Invalid manage users action.',
  );

  // Non-admin user
  await expectThrows(
    () => new ManageUsersUseCase({ userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'doctor' }, [targetUser.id]: targetUser }) }).execute({ adminId: admin.id, userId: targetUser.id, action: 'verify' }),
    'Access denied. Admin role required.',
  );

  // User not found
  await expectThrows(
    () => new ManageUsersUseCase({ userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, userId: 'missing', action: 'verify' }),
    'User not found.',
  );

  // Success verify
  const repoVerify = new FakeUserRepository({ [admin.id]: admin, [targetUser.id]: new FakeUser(targetUser.id) });
  const verifyResult = await new ManageUsersUseCase({ userRepository: repoVerify }).execute({ adminId: admin.id, userId: targetUser.id, action: 'verify' });
  assert.strictEqual(verifyResult.status, 'verified');
  assert.strictEqual(repoVerify.saved.status, 'verified');

  // Success disable
  const repoDisable = new FakeUserRepository({ [admin.id]: admin, [targetUser.id]: new FakeUser(targetUser.id) });
  const disableResult = await new ManageUsersUseCase({ userRepository: repoDisable }).execute({ adminId: admin.id, userId: targetUser.id, action: 'disable' });
  assert.strictEqual(disableResult.status, 'disabled');
  assert.strictEqual(repoDisable.saved.status, 'disabled');

  // Success enable
  const repoEnable = new FakeUserRepository({ [admin.id]: admin, [targetUser.id]: new FakeUser(targetUser.id) });
  const enableResult = await new ManageUsersUseCase({ userRepository: repoEnable }).execute({ adminId: admin.id, userId: targetUser.id, action: 'enable' });
  assert.strictEqual(enableResult.status, 'active');
  assert.strictEqual(repoEnable.saved.status, 'active');
}

run()
  .then(() => console.log('manageUsers.usecase tests passed'))
  .catch((err) => {
    console.error('manageUsers.usecase tests failed', err);
    process.exit(1);
  });
