import assert from 'node:assert';
import { SendDoctorMessageUseCase } from '../../../../src/application/use-cases/doctor/sendDoctorMessage.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeDoctorRepository {
  constructor(doctors) {
    this.doctors = doctors;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
}

class FakePatientRepository {
  constructor(patients) {
    this.patients = patients;
  }
  async findById(id) {
    return this.patients[id] ?? null;
  }
}

class FakeMessageRepository {
  constructor() {
    this.created = null;
  }
  async create(message) {
    this.created = message;
    return { id: 'msg-1', ...message };
  }
}

class FakeNotificationService {
  constructor() {
    this.sent = null;
  }
  async sendNotification(payload) {
    this.sent = payload;
  }
}

const doctor = { id: 'doc-1' };
const patient = { id: 'pat-1' };

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
    doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
    patientRepository: new FakePatientRepository({ [patient.id]: patient }),
    messageRepository: new FakeMessageRepository(),
    notificationService: new FakeNotificationService(),
  };

  // Missing doctorId
  await expectThrows(
    () => new SendDoctorMessageUseCase(baseDeps).execute({ patientId: patient.id, content: 'hi' }),
    'Doctor id is required.',
  );

  // Missing patientId
  await expectThrows(
    () => new SendDoctorMessageUseCase(baseDeps).execute({ doctorId: doctor.id, content: 'hi' }),
    'Patient id is required.',
  );

  // Missing content
  await expectThrows(
    () => new SendDoctorMessageUseCase(baseDeps).execute({ doctorId: doctor.id, patientId: patient.id }),
    'Message content is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new SendDoctorMessageUseCase({ ...baseDeps, doctorRepository: new FakeDoctorRepository({}) }).execute({ doctorId: doctor.id, patientId: patient.id, content: 'hi' }),
    'Doctor not found.',
  );

  // Patient not found
  await expectThrows(
    () => new SendDoctorMessageUseCase({ ...baseDeps, patientRepository: new FakePatientRepository({}) }).execute({ doctorId: doctor.id, patientId: patient.id, content: 'hi' }),
    'Patient not found.',
  );

  // Success
  const messageRepo = new FakeMessageRepository();
  const notifier = new FakeNotificationService();
  const result = await new SendDoctorMessageUseCase({ ...baseDeps, messageRepository: messageRepo, notificationService: notifier }).execute({ doctorId: doctor.id, patientId: patient.id, content: 'Hello patient' });
  assert.strictEqual(result.delivered, true);
  assert.strictEqual(result.messageId, 'msg-1');
  assert.ok(messageRepo.created);
  assert.strictEqual(messageRepo.created.fromDoctorId, doctor.id);
  assert.strictEqual(notifier.sent.recipientId, patient.id);
  assert.strictEqual(notifier.sent.channel, 'in_app');
}

run()
  .then(() => console.log('sendDoctorMessage.usecase tests passed'))
  .catch((err) => {
    console.error('sendDoctorMessage.usecase tests failed', err);
    process.exit(1);
  });
