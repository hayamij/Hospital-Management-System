import assert from 'node:assert';
import { RegisterPatientAccountUseCase } from '../../../../server/application/use-cases/patient/registerPatientAccount.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeUserRepository {
  constructor(existing = null) {
    this.existing = existing;
    this.savedUser = null;
  }
  async findByEmail(email) {
    return this.existing && this.existing.email === email ? this.existing : null;
  }
  async save(user) {
    this.savedUser = user;
    return user;
  }
}

class FakePatientRepository {
  constructor(created) {
    this.created = created;
    this.lastPayload = null;
  }
  async create(payload) {
    this.lastPayload = payload;
    return this.created ?? { id: 'pat-1', ...payload };
  }
}

class FakeAuthService {
  constructor() {
    this.hashed = null;
  }
  async hashPassword(pw) {
    this.hashed = `hash-${pw}`;
    return this.hashed;
  }
}

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
  const baseInput = { fullName: ' Guest ', email: ' guest@example.com ', password: 'password123', phone: ' 123456 ' };

  await expectThrows(
    () => new RegisterPatientAccountUseCase({ userRepository: new FakeUserRepository(), patientRepository: new FakePatientRepository(), authService: new FakeAuthService() }).execute({ ...baseInput, fullName: ' ' }),
    'Full name is required.',
  );

  await expectThrows(
    () => new RegisterPatientAccountUseCase({ userRepository: new FakeUserRepository(), patientRepository: new FakePatientRepository(), authService: new FakeAuthService() }).execute({ ...baseInput, email: ' ' }),
    'Email is required.',
  );

  await expectThrows(
    () => new RegisterPatientAccountUseCase({ userRepository: new FakeUserRepository(), patientRepository: new FakePatientRepository(), authService: new FakeAuthService() }).execute({ ...baseInput, password: '' }),
    'Password is required.',
  );

  await expectThrows(
    () => new RegisterPatientAccountUseCase({ userRepository: new FakeUserRepository(), patientRepository: new FakePatientRepository(), authService: new FakeAuthService() }).execute({ ...baseInput, password: 'short' }),
    'Password must be at least 8 characters.',
  );

  await expectThrows(
    () => new RegisterPatientAccountUseCase({ userRepository: new FakeUserRepository(), patientRepository: new FakePatientRepository(), authService: new FakeAuthService() }).execute({ ...baseInput, phone: ' ' }),
    'Phone is required.',
  );

  await expectThrows(
    () => new RegisterPatientAccountUseCase({ userRepository: new FakeUserRepository({ email: 'guest@example.com' }), patientRepository: new FakePatientRepository(), authService: new FakeAuthService() }).execute(baseInput),
    'Email already registered.',
  );

  const auth = new FakeAuthService();
  const patientRepo = new FakePatientRepository({ patientId: 'pat-99' });
  const userRepo = new FakeUserRepository();
  const result = await new RegisterPatientAccountUseCase({ userRepository: userRepo, patientRepository: patientRepo, authService: auth }).execute(baseInput);
  assert.strictEqual(result.patientId, 'pat-99');
  assert.strictEqual(result.status, 'active');
  assert.ok(auth.hashed);
  assert.ok(patientRepo.lastPayload.createdAt instanceof Date);
  assert.strictEqual(patientRepo.lastPayload.contactInfo.email, 'guest@example.com');
  assert.strictEqual(patientRepo.lastPayload.contactInfo.phone, '123456');
  assert.ok(userRepo.savedUser);
  assert.strictEqual(userRepo.savedUser.role, 'patient');
}

wrapLegacyRun(run, 'registerPatientAccount.usecase');

