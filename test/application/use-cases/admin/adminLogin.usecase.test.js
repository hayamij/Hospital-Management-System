import assert from 'node:assert';
import { AdminLoginUseCase } from '../../../../src/application/use-cases/admin/adminLogin.usecase.js';
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

const baseAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  passwordHash: 'hashed',
  role: 'admin',
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
    () => new AdminLoginUseCase({ userRepository: new FakeUserRepository(baseAdmin), authService: new FakeAuthService() }).execute({ password: 'x' }),
    'Email is required.',
  );

  // Missing password
  await expectThrows(
    () => new AdminLoginUseCase({ userRepository: new FakeUserRepository(baseAdmin), authService: new FakeAuthService() }).execute({ email: 'admin@example.com' }),
    'Password is required.',
  );

  // User not found
  await expectThrows(
    () => new AdminLoginUseCase({ userRepository: new FakeUserRepository(null), authService: new FakeAuthService() }).execute({ email: 'none@example.com', password: 'x' }),
    'Invalid credentials.',
  );

  // Not admin role
  await expectThrows(
    () => new AdminLoginUseCase({ userRepository: new FakeUserRepository({ ...baseAdmin, role: 'doctor' }), authService: new FakeAuthService() }).execute({ email: 'admin@example.com', password: 'x' }),
    'Access denied. Admin role required.',
  );

  // Wrong password
  await expectThrows(
    () => new AdminLoginUseCase({ userRepository: new FakeUserRepository(baseAdmin), authService: new FakeAuthService({ passwordOk: false }) }).execute({ email: 'admin@example.com', password: 'wrong' }),
    'Invalid credentials.',
  );

  // Success path
  const usecase = new AdminLoginUseCase({ userRepository: new FakeUserRepository(baseAdmin), authService: new FakeAuthService() });
  const result = await usecase.execute({ email: 'admin@example.com', password: 'secret' });
  assert.strictEqual(result.adminId, baseAdmin.id);
  assert.strictEqual(result.role, 'admin');
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.ok(result.expiresAt instanceof Date);
}

run().then(() => {
  console.log('adminLogin.usecase tests passed');
}).catch((err) => {
  console.error('adminLogin.usecase tests failed', err);
  process.exit(1);
});
