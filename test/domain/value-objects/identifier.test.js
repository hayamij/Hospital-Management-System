import assert from 'node:assert';
import { Identifier } from '../../../server/domain/value-objects/identifier.js';
import { DomainError } from '../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

async function expectThrows(fn, message) {
  let threw = false;
  try { await fn(); } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError);
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  await expectThrows(() => Promise.resolve(new Identifier(' ')), 'Identifier cannot be empty.');

  const id1 = new Identifier('abc');
  const id2 = new Identifier('abc');
  const id3 = new Identifier('xyz');

  assert.strictEqual(id1.toString(), 'abc');
  assert.ok(id1.equals(id2));
  assert.ok(!id1.equals(id3));
}

wrapLegacyRun(run, 'identifier');

