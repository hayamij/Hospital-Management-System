import assert from 'node:assert';
import { BaseEntity } from '../../../src/domain/entities/baseEntity.js';
import { DomainError } from '../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class ConcreteEntity extends BaseEntity {}

async function expectThrows(fn, message) {
  let threw = false;
  try {
    await fn();
  } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError);
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  const now = new Date('2025-01-01T00:00:00Z');
  const entity = new ConcreteEntity('id-1', now);
  assert.strictEqual(entity.getId(), 'id-1');
  assert.strictEqual(entity.getCreatedAt().getTime(), now.getTime());
  assert.strictEqual(entity.getUpdatedAt().getTime(), now.getTime());

  const later = new Date('2025-01-02T00:00:00Z');
  const entity2 = new ConcreteEntity('id-2', now, later);
  assert.strictEqual(entity2.getUpdatedAt().getTime(), later.getTime());

  await expectThrows(() => Promise.resolve(new ConcreteEntity('id-3', later, now)), 'updatedAt cannot be earlier than createdAt.');

  const beforeTouch = entity.getUpdatedAt().getTime();
  entity.touch();
  assert.ok(entity.getUpdatedAt().getTime() >= beforeTouch);
}

wrapLegacyRun(run, 'baseEntity');

