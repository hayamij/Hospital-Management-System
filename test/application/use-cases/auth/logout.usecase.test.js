import assert from 'node:assert';
import { LogoutUseCase } from '../../../../server/application/use-cases/auth/logout.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeUserRepository {
  constructor(users) {
    this.users = users;
  }
  async findById(id) {
    return this.users[id] ?? null;
  }
}

class FakeAuthService {
  constructor() {
    this.revoked = null;
  }
  async revokeTokens(payload) {
    this.revoked = payload;
  }
}

const user = { id: 'user-1' };

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
  // Missing userId
  await expectThrows(
    () => new LogoutUseCase({ userRepository: new FakeUserRepository({}), authService: new FakeAuthService() }).execute({ refreshToken: 'r1' }),
    'User id is required.',
  );

  // Missing tokens
  await expectThrows(
    () => new LogoutUseCase({ userRepository: new FakeUserRepository({ [user.id]: user }), authService: new FakeAuthService() }).execute({ userId: user.id }),
    'At least one token is required to logout.',
  );

  // User not found
  await expectThrows(
    () => new LogoutUseCase({ userRepository: new FakeUserRepository({}), authService: new FakeAuthService() }).execute({ userId: 'missing', refreshToken: 'r1' }),
    'User not found.',
  );

  // Success with refresh token only
  const authService = new FakeAuthService();
  const result = await new LogoutUseCase({ userRepository: new FakeUserRepository({ [user.id]: user }), authService }).execute({ userId: user.id, refreshToken: 'r1' });
  assert.strictEqual(result.success, true);
  assert.deepStrictEqual(authService.revoked, { userId: user.id, refreshToken: 'r1', accessToken: undefined });

  // Success with access token only
  const authService2 = new FakeAuthService();
  const result2 = await new LogoutUseCase({ userRepository: new FakeUserRepository({ [user.id]: user }), authService: authService2 }).execute({ userId: user.id, accessToken: 'a1' });
  assert.strictEqual(result2.success, true);
  assert.deepStrictEqual(authService2.revoked, { userId: user.id, refreshToken: undefined, accessToken: 'a1' });
}

wrapLegacyRun(run, 'logout.usecase');

