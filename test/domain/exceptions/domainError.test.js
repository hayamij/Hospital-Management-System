import assert from 'node:assert';
import { DomainError } from '../../../src/domain/exceptions/domainError.js';

async function run() {
  const err = new DomainError('boom');
  assert.strictEqual(err.message, 'boom');
  assert.strictEqual(err.name, 'DomainError');
  assert.ok(err instanceof Error);
}

run()
  .then(() => console.log('domainError tests passed'))
  .catch((err) => {
    console.error('domainError tests failed', err);
    process.exit(1);
  });
