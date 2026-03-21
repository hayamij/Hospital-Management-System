import assert from 'node:assert';
import { SubmitContactFormUseCase } from '../../../../src/application/use-cases/guest/submitContactForm.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeContactLeadRepository {
  constructor(created) {
    this.created = created;
    this.lastPayload = null;
  }
  async create(lead) {
    this.lastPayload = lead;
    return this.created ?? { id: 'lead-1', ...lead };
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
  // Missing name
  await expectThrows(
    () => new SubmitContactFormUseCase({ contactLeadRepository: new FakeContactLeadRepository() }).execute({ email: 'a@b.com', message: 'hi' }),
    'Name is required.',
  );

  // Missing email
  await expectThrows(
    () => new SubmitContactFormUseCase({ contactLeadRepository: new FakeContactLeadRepository() }).execute({ name: 'A', message: 'hi' }),
    'Email is required.',
  );

  // Missing message
  await expectThrows(
    () => new SubmitContactFormUseCase({ contactLeadRepository: new FakeContactLeadRepository() }).execute({ name: 'A', email: 'a@b.com' }),
    'Message is required.',
  );

  // Success default created object
  const repo = new FakeContactLeadRepository();
  const result = await new SubmitContactFormUseCase({ contactLeadRepository: repo }).execute({ name: ' User ', email: ' user@example.com ', message: ' Hello ' });
  assert.strictEqual(result.success, true);
  assert.ok(result.leadId);
  assert.strictEqual(repo.lastPayload.name, 'User');
  assert.strictEqual(repo.lastPayload.email, 'user@example.com');
  assert.strictEqual(repo.lastPayload.message, 'Hello');
  assert.strictEqual(repo.lastPayload.status, 'pending');
  assert.ok(repo.lastPayload.createdAt instanceof Date);

  // Success with primitive id
  const repoId = new FakeContactLeadRepository('lead-99');
  const resultId = await new SubmitContactFormUseCase({ contactLeadRepository: repoId }).execute({ name: 'B', email: 'b@c.com', message: 'Ping' });
  assert.strictEqual(resultId.leadId, 'lead-99');
}

run()
  .then(() => console.log('submitContactForm.usecase tests passed'))
  .catch((err) => {
    console.error('submitContactForm.usecase tests failed', err);
    process.exit(1);
  });
