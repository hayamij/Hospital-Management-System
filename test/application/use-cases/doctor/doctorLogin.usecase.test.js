import assert from 'node:assert';
import { DoctorLoginUseCase } from '../../../../server/application/use-cases/doctor/doctorLogin.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

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

const baseDoctor = {
  id: 'doc-1',
  email: 'doc@example.com',
  passwordHash: 'hash',
  role: 'doctor',
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
    () => new DoctorLoginUseCase({ userRepository: new FakeUserRepository(baseDoctor), authService: new FakeAuthService() }).execute({ password: 'x' }),
    'Email is required.',
  );

  // Missing password
  await expectThrows(
    () => new DoctorLoginUseCase({ userRepository: new FakeUserRepository(baseDoctor), authService: new FakeAuthService() }).execute({ email: baseDoctor.email }),
    'Password is required.',
  );

  // User not found
  await expectThrows(
    () => new DoctorLoginUseCase({ userRepository: new FakeUserRepository(null), authService: new FakeAuthService() }).execute({ email: 'none@example.com', password: 'x' }),
    'Invalid credentials.',
  );

  // Wrong role
  await expectThrows(
    () => new DoctorLoginUseCase({ userRepository: new FakeUserRepository({ ...baseDoctor, role: 'patient' }), authService: new FakeAuthService() }).execute({ email: baseDoctor.email, password: 'x' }),
    'Access denied. Doctor role required.',
  );

  // Disabled account
  await expectThrows(
    () => new DoctorLoginUseCase({ userRepository: new FakeUserRepository({ ...baseDoctor, status: 'disabled' }), authService: new FakeAuthService() }).execute({ email: baseDoctor.email, password: 'x' }),
    'Account is disabled.',
  );

  // Wrong password
  await expectThrows(
    () => new DoctorLoginUseCase({ userRepository: new FakeUserRepository(baseDoctor), authService: new FakeAuthService({ passwordOk: false }) }).execute({ email: baseDoctor.email, password: 'wrong' }),
    'Invalid credentials.',
  );

  // Success
  const usecase = new DoctorLoginUseCase({ userRepository: new FakeUserRepository(baseDoctor), authService: new FakeAuthService() });
  const result = await usecase.execute({ email: baseDoctor.email, password: 'secret' });
  assert.strictEqual(result.doctorId, baseDoctor.id);
  assert.strictEqual(result.role, 'doctor');
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.ok(result.expiresAt instanceof Date);
}

wrapLegacyRun(run, 'doctorLogin.usecase');

