import assert from 'node:assert';
import { ResetPasswordUseCase } from '../../../../src/application/use-cases/auth/resetPassword.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeUser {
  constructor({ id, email, passwordHash }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.touched = false;
  }
  touch() {
    this.touched = true;
  }
}

class FakeUserRepository {
  constructor(users) {
    this.users = users;
    this.saved = null;
  }
  async findByEmail(email) {
    return Object.values(this.users).find((u) => u.email === email) ?? null;
  }
  async save(user) {
    this.saved = user;
    this.users[user.id] = user;
  }
}

class FakeAuthService {
  constructor({ passwordOk = true } = {}) {
    this.passwordOk = passwordOk;
    this.hashed = null;
  }
  async comparePassword(_plain, _hash) {
    return this.passwordOk;
  }
  async hashPassword(newPassword) {
    this.hashed = `hash-${newPassword}`;
    return this.hashed;
  }
}

const user = new FakeUser({ id: 'user-1', email: 'user@example.com', passwordHash: 'old-hash' });

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
  // Missing email
  await expectThrows(
    () => new ResetPasswordUseCase({ userRepository: new FakeUserRepository({}), authService: new FakeAuthService() }).execute({ oldPassword: 'old', newPassword: 'newPass123' }),
    'Email is required.',
  );

  // Missing old password
  await expectThrows(
    () => new ResetPasswordUseCase({ userRepository: new FakeUserRepository({ [user.id]: user }), authService: new FakeAuthService() }).execute({ email: user.email, newPassword: 'newPass123' }),
    'Old password is required.',
  );

  // Missing new password
  await expectThrows(
    () => new ResetPasswordUseCase({ userRepository: new FakeUserRepository({ [user.id]: user }), authService: new FakeAuthService() }).execute({ email: user.email, oldPassword: 'old' }),
    'New password is required.',
  );

  // New password too short
  await expectThrows(
    () => new ResetPasswordUseCase({ userRepository: new FakeUserRepository({ [user.id]: user }), authService: new FakeAuthService() }).execute({ email: user.email, oldPassword: 'old', newPassword: 'short' }),
    'New password must be at least 8 characters.',
  );

  // User not found
  await expectThrows(
    () => new ResetPasswordUseCase({ userRepository: new FakeUserRepository({}), authService: new FakeAuthService() }).execute({ email: user.email, oldPassword: 'old', newPassword: 'newPass123' }),
    'User not found.',
  );

  // Wrong password
  await expectThrows(
    () => new ResetPasswordUseCase({ userRepository: new FakeUserRepository({ [user.id]: user }), authService: new FakeAuthService({ passwordOk: false }) }).execute({ email: user.email, oldPassword: 'bad', newPassword: 'newPass123' }),
    'Invalid credentials.',
  );

  // Success
  const repo = new FakeUserRepository({ [user.id]: new FakeUser({ ...user }) });
  const auth = new FakeAuthService({ passwordOk: true });
  const result = await new ResetPasswordUseCase({ userRepository: repo, authService: auth }).execute({ email: user.email, oldPassword: 'old', newPassword: 'newPass123' });
  assert.strictEqual(result.success, true);
  assert.strictEqual(repo.saved.passwordHash, 'hash-newPass123');
  assert.ok(repo.saved.touched);
  assert.strictEqual(auth.hashed, 'hash-newPass123');
}

wrapLegacyRun(run, 'resetPassword.usecase');

