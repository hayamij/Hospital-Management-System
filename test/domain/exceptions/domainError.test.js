import assert from 'node:assert';
import { DomainError } from '../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

async function run() {
  const err = new DomainError('boom');
  assert.strictEqual(err.message, 'boom');
  assert.strictEqual(err.name, 'DomainError');
  assert.ok(err instanceof Error);
}

wrapLegacyRun(run, 'domainError');

