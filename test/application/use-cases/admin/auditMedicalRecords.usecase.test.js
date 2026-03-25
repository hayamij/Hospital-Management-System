import assert from 'node:assert';
import { AuditMedicalRecordsUseCase } from '../../../../server/application/use-cases/admin/auditMedicalRecords.usecase.js';
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

class FakeMedicalRecordRepository {
  constructor(records) {
    this.records = records;
  }
  async findById(id) {
    return this.records[id] ?? null;
  }
}

class FakeAuditLogRepository {
  constructor() {
    this.lastEntry = null;
  }
  async append(entry) {
    this.lastEntry = entry;
  }
}

const admin = { id: 'admin-1', role: 'admin' };
const record = { id: 'rec-1' };

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
  const baseDeps = {
    medicalRecordRepository: new FakeMedicalRecordRepository({ [record.id]: record }),
    auditLogRepository: new FakeAuditLogRepository(),
    userRepository: new FakeUserRepository({ [admin.id]: admin }),
  };

  // Missing adminId
  await expectThrows(
    () => new AuditMedicalRecordsUseCase(baseDeps).execute({ recordId: record.id, action: 'view', reason: 'check' }),
    'Admin id is required.',
  );

  // Missing recordId
  await expectThrows(
    () => new AuditMedicalRecordsUseCase(baseDeps).execute({ adminId: admin.id, action: 'view', reason: 'check' }),
    'Record id is required.',
  );

  // Missing action
  await expectThrows(
    () => new AuditMedicalRecordsUseCase(baseDeps).execute({ adminId: admin.id, recordId: record.id, reason: 'check' }),
    'Action is required.',
  );

  // Missing reason
  await expectThrows(
    () => new AuditMedicalRecordsUseCase(baseDeps).execute({ adminId: admin.id, recordId: record.id, action: 'view' }),
    'Reason is required.',
  );

  // Non-admin user
  await expectThrows(
    () => new AuditMedicalRecordsUseCase({ ...baseDeps, userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'doctor' } }) }).execute({ adminId: admin.id, recordId: record.id, action: 'view', reason: 'check' }),
    'Access denied. Admin role required.',
  );

  // Record not found
  await expectThrows(
    () => new AuditMedicalRecordsUseCase({ ...baseDeps, medicalRecordRepository: new FakeMedicalRecordRepository({}) }).execute({ adminId: admin.id, recordId: 'missing', action: 'view', reason: 'check' }),
    'Medical record not found.',
  );

  // Success
  const deps = {
    medicalRecordRepository: new FakeMedicalRecordRepository({ [record.id]: record }),
    auditLogRepository: new FakeAuditLogRepository(),
    userRepository: new FakeUserRepository({ [admin.id]: admin }),
  };
  const result = await new AuditMedicalRecordsUseCase(deps).execute({ adminId: admin.id, recordId: record.id, action: 'view', reason: 'compliance' });
  assert.strictEqual(result.recordId, record.id);
  assert.strictEqual(result.action, 'view');
  assert.strictEqual(result.adminId, admin.id);
  assert.ok(result.auditedAt instanceof Date);
  assert.ok(deps.auditLogRepository.lastEntry);
  assert.strictEqual(deps.auditLogRepository.lastEntry.recordId, record.id);
  assert.strictEqual(deps.auditLogRepository.lastEntry.reason, 'compliance');
}

wrapLegacyRun(run, 'auditMedicalRecords.usecase');

