import assert from 'node:assert';
import { LoginUseCase } from '../../../../src/application/use-cases/auth/login.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeUserRepository {
  constructor(user) {
    this.user = user;
  }
  async findByEmail(email) {
    if (this.user && this.user.email === email) return this.user;
    return null;
  }
}

class FakeAuthService {
  constructor({ passwordOk = true } = {}) {
    this.passwordOk = passwordOk;
  }
  async comparePassword(_plain, _hash) {
    return this.passwordOk;
  }
  async generateTokens({ userId, role }) {
    return {
      accessToken: `access-${userId}`,
      refreshToken: `refresh-${userId}`,
      expiresAt: new Date(Date.now() + 3600_000),
      role,
    };
  }
}

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'hashed',
  role: 'patient',
  status: 'active',
};

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
    () => new LoginUseCase({ userRepository: new FakeUserRepository(baseUser), authService: new FakeAuthService() }).execute({ password: 'x' }),
    'Email is required.',
  );

  // Missing password
  await expectThrows(
    () => new LoginUseCase({ userRepository: new FakeUserRepository(baseUser), authService: new FakeAuthService() }).execute({ email: 'user@example.com' }),
    'Password is required.',
  );

  // User not found
  await expectThrows(
    () => new LoginUseCase({ userRepository: new FakeUserRepository(null), authService: new FakeAuthService() }).execute({ email: 'none@example.com', password: 'x' }),
    'Invalid credentials.',
  );

  // Account disabled
  await expectThrows(
    () => new LoginUseCase({ userRepository: new FakeUserRepository({ ...baseUser, status: 'disabled' }), authService: new FakeAuthService() }).execute({ email: 'user@example.com', password: 'x' }),
    'Account is disabled.',
  );

  // Account inactive
  await expectThrows(
    () => new LoginUseCase({ userRepository: new FakeUserRepository({ ...baseUser, status: 'inactive' }), authService: new FakeAuthService() }).execute({ email: 'user@example.com', password: 'x' }),
    'Account is disabled.',
  );

  // Wrong password
  await expectThrows(
    () => new LoginUseCase({ userRepository: new FakeUserRepository(baseUser), authService: new FakeAuthService({ passwordOk: false }) }).execute({ email: 'user@example.com', password: 'wrong' }),
    'Invalid credentials.',
  );

  // Success
  const usecase = new LoginUseCase({ userRepository: new FakeUserRepository(baseUser), authService: new FakeAuthService() });
  const result = await usecase.execute({ email: 'user@example.com', password: 'secret' });
  assert.strictEqual(result.userId, baseUser.id);
  assert.strictEqual(result.role, baseUser.role);
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.ok(result.expiresAt instanceof Date);
}

run()
  .then(() => console.log('login.usecase tests passed'))
  .catch((err) => {
    console.error('login.usecase tests failed', err);
    process.exit(1);
  });
