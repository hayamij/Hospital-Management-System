import assert from 'node:assert';
import { ManageBillingUseCase } from '../../../../src/application/use-cases/admin/manageBilling.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeBilling {
  constructor({ id, total = 200 }) {
    this.id = id;
    this.status = 'draft';
    this.dueDate = null;
    this.total = total;
  }
  issue(dueDate) {
    this.dueDate = dueDate;
    this.status = 'issued';
  }
  markPaid() {
    this.status = 'paid';
  }
  void() {
    this.status = 'void';
  }
  getInvoiceNumber() {
    return this.id;
  }
  getStatus() {
    return this.status;
  }
  calculateTotal() {
    return this.total;
  }
  getDueDate() {
    return this.dueDate;
  }
}

class FakeBillingRepository {
  constructor(items) {
    this.items = items;
    this.saved = null;
  }
  async findById(id) {
    return this.items[id] ?? null;
  }
  async save(billing) {
    this.saved = billing;
    this.items[billing.id] = billing;
  }
}

class FakeUserRepository {
  constructor(users) {
    this.users = users;
  }
  async findById(id) {
    return this.users[id] ?? null;
  }
}

const admin = { id: 'admin-1', role: 'admin' };
const billing = new FakeBilling({ id: 'inv-1' });

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
    () => new ManageBillingUseCase({ billingRepository: new FakeBillingRepository({}), userRepository: new FakeUserRepository({}) }).execute({ invoiceId: billing.id, action: 'issue' }),
    'Admin id is required.',
  );

  // Missing invoiceId
  await expectThrows(
    () => new ManageBillingUseCase({ billingRepository: new FakeBillingRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, action: 'issue', dueDate: new Date() }),
    'Invoice id is required.',
  );

  // Invalid action
  await expectThrows(
    () => new ManageBillingUseCase({ billingRepository: new FakeBillingRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, invoiceId: billing.id, action: 'something' }),
    'Invalid billing action.',
  );

  // Non-admin user
  await expectThrows(
    () => new ManageBillingUseCase({ billingRepository: new FakeBillingRepository({ [billing.id]: billing }), userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'patient' } }) }).execute({ adminId: admin.id, invoiceId: billing.id, action: 'issue', dueDate: new Date() }),
    'Access denied. Admin role required.',
  );

  // Invoice not found
  await expectThrows(
    () => new ManageBillingUseCase({ billingRepository: new FakeBillingRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, invoiceId: 'missing', action: 'issue', dueDate: new Date() }),
    'Invoice not found.',
  );

  // Issue without due date
  await expectThrows(
    () => new ManageBillingUseCase({ billingRepository: new FakeBillingRepository({ [billing.id]: new FakeBilling({ id: billing.id }) }), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, invoiceId: billing.id, action: 'issue' }),
    'Due date is required to issue an invoice.',
  );

  // Success issue
  const repoIssue = new FakeBillingRepository({ [billing.id]: new FakeBilling({ id: billing.id }) });
  const issueResult = await new ManageBillingUseCase({ billingRepository: repoIssue, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, invoiceId: billing.id, action: 'issue', dueDate: '2025-01-01' });
  assert.strictEqual(issueResult.invoiceId, billing.id);
  assert.strictEqual(issueResult.status, 'issued');
  assert.ok(issueResult.dueDate instanceof Date);
  assert.strictEqual(repoIssue.saved.getStatus(), 'issued');

  // Success markPaid
  const repoPaid = new FakeBillingRepository({ [billing.id]: new FakeBilling({ id: billing.id }) });
  const paidResult = await new ManageBillingUseCase({ billingRepository: repoPaid, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, invoiceId: billing.id, action: 'markPaid' });
  assert.strictEqual(paidResult.status, 'paid');
  assert.strictEqual(repoPaid.saved.getStatus(), 'paid');

  // Success void
  const repoVoid = new FakeBillingRepository({ [billing.id]: new FakeBilling({ id: billing.id }) });
  const voidResult = await new ManageBillingUseCase({ billingRepository: repoVoid, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, invoiceId: billing.id, action: 'void' });
  assert.strictEqual(voidResult.status, 'void');
  assert.strictEqual(repoVoid.saved.getStatus(), 'void');
}

run()
  .then(() => console.log('manageBilling.usecase tests passed'))
  .catch((err) => {
    console.error('manageBilling.usecase tests failed', err);
    process.exit(1);
  });
