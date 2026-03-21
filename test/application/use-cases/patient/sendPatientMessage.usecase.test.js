import assert from 'node:assert';
import { SendPatientMessageUseCase } from '../../../../src/application/use-cases/patient/sendPatientMessage.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
  constructor(patients) { this.patients = patients; }
  async findById(id) { return this.patients[id] ?? null; }
}

class FakeDoctorRepository {
  constructor(doctors) { this.doctors = doctors; }
  async findById(id) { return this.doctors[id] ?? null; }
}

class FakeMessageRepository {
  constructor(created) { this.created = created; this.lastPayload = null; }
  async create(payload) { this.lastPayload = payload; return this.created ?? { id: 'msg-1', ...payload }; }
}

class FakeNotificationService {
  constructor() { this.sent = null; }
  async sendNotification(payload) { this.sent = payload; }
}

const patient = { id: 'pat-1' };
const doctor = { id: 'doc-1' };

async function expectThrows(fn, message) {
  let threw = false;
  try { await fn(); } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError, 'Expected DomainError');
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  await expectThrows(() => new SendPatientMessageUseCase({ patientRepository: new FakePatientRepository({}), doctorRepository: new FakeDoctorRepository({}), messageRepository: new FakeMessageRepository(), notificationService: new FakeNotificationService() }).execute({ doctorId: doctor.id, message: 'hi' }), 'Patient id is required.');
  await expectThrows(() => new SendPatientMessageUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({}), messageRepository: new FakeMessageRepository(), notificationService: new FakeNotificationService() }).execute({ patientId: patient.id, message: 'hi' }), 'Doctor id is required.');
  await expectThrows(() => new SendPatientMessageUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({ doctor }), messageRepository: new FakeMessageRepository(), notificationService: new FakeNotificationService() }).execute({ patientId: patient.id, doctorId: doctor.id }), 'Message content is required.');
  await expectThrows(() => new SendPatientMessageUseCase({ patientRepository: new FakePatientRepository({}), doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), messageRepository: new FakeMessageRepository(), notificationService: new FakeNotificationService() }).execute({ patientId: patient.id, doctorId: doctor.id, message: 'hi' }), 'Patient not found.');
  await expectThrows(() => new SendPatientMessageUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), doctorRepository: new FakeDoctorRepository({}), messageRepository: new FakeMessageRepository(), notificationService: new FakeNotificationService() }).execute({ patientId: patient.id, doctorId: doctor.id, message: 'hi' }), 'Doctor not found.');

  const messageRepo = new FakeMessageRepository({ messageId: 'msg-99', createdAt: new Date('2025-01-01T00:00:00Z') });
  const notifier = new FakeNotificationService();
  const result = await new SendPatientMessageUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), messageRepository: messageRepo, notificationService: notifier }).execute({ patientId: patient.id, doctorId: doctor.id, subject: 'Hello', message: 'Check results' });
  assert.strictEqual(result.messageId, 'msg-99');
  assert.strictEqual(result.status, 'sent');
  assert.ok(result.sentAt instanceof Date);
  assert.strictEqual(messageRepo.lastPayload.fromPatientId, patient.id);
  assert.strictEqual(messageRepo.lastPayload.toDoctorId, doctor.id);
  assert.strictEqual(messageRepo.lastPayload.subject, 'Hello');
  assert.strictEqual(notifier.sent.recipientId, doctor.id);
}

wrapLegacyRun(run, 'sendPatientMessage.usecase');

