import assert from 'node:assert';
import { test } from 'vitest';
import { Appointment } from '../../server/domain/entities/appointment.js';
import { CancelAppointmentUseCase } from '../../server/application/use-cases/patient/cancelAppointment.usecase.js';
import { ViewDoctorScheduleUseCase } from '../../server/application/use-cases/doctor/viewDoctorSchedule.usecase.js';
import { AddVisitNoteUseCase } from '../../server/application/use-cases/doctor/addVisitNote.usecase.js';
import { ViewMedicalRecordsUseCase } from '../../server/application/use-cases/patient/viewMedicalRecords.usecase.js';
import { MarkAppointmentStatusUseCase } from '../../server/application/use-cases/doctor/markAppointmentStatus.usecase.js';
import { ViewBillingAndPaymentsUseCase } from '../../server/application/use-cases/patient/viewBillingAndPayments.usecase.js';

class InMemoryDoctorRepository {
  constructor(items = []) {
    this.items = new Map(items.map((item) => [item.id, { ...item }]));
  }

  async findById(id) {
    return this.items.get(id) ?? null;
  }
}

class InMemoryPatientRepository {
  constructor(items = []) {
    this.items = new Map(items.map((item) => [item.id, { ...item }]));
  }

  async findById(id) {
    return this.items.get(id) ?? null;
  }
}

class InMemoryAppointmentRepository {
  constructor(items = []) {
    this.items = new Map(items.map((item) => [item.id, item]));
  }

  async findById(id) {
    return this.items.get(id) ?? null;
  }

  async save(appointment) {
    this.items.set(appointment.id, appointment);
    return appointment;
  }

  async listByDoctor(doctorId, { from, to } = {}) {
    const list = [...this.items.values()].filter((appointment) => {
      if (appointment.doctorId !== doctorId) return false;

      if (from && appointment.startAt < from) return false;
      if (to && appointment.startAt > to) return false;

      return true;
    });

    return list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  async listByPatient(patientId) {
    const list = [...this.items.values()].filter((appointment) => appointment.patientId === patientId);
    return list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }
}

class InMemoryMedicalRecordRepository {
  constructor() {
    this.byPatientId = new Map();
    this.byId = new Map();
    this.sequence = 1;
  }

  async findByPatientId(patientId) {
    return this.byPatientId.get(patientId) ?? null;
  }

  async findById(id) {
    return this.byId.get(id) ?? null;
  }

  async save(record) {
    if (!record.id) {
      record.id = `mr-${this.sequence++}`;
    }

    this.byPatientId.set(record.patientId, record);
    this.byId.set(record.id, record);
    return record;
  }
}

class InMemoryBillingRepository {
  constructor() {
    this.byPatientId = new Map();
    this.byId = new Map();
    this.sequence = 1;
  }

  async listByPatient(patientId) {
    return this.byPatientId.get(patientId) ?? [];
  }

  async findById(id) {
    return this.byId.get(id) ?? null;
  }

  async save(billing) {
    if (!billing.id) {
      billing.id = `bill-${this.sequence++}`;
    }

    const patientId = billing.getPatientId();
    const current = this.byPatientId.get(patientId) ?? [];
    this.byPatientId.set(patientId, [...current, billing]);
    this.byId.set(billing.id, billing);
    return billing;
  }
}

class InMemoryPaymentRepository {
  async listByPatient() {
    return [];
  }
}

class InMemoryServiceCatalogRepository {
  constructor(items = []) {
    this.items = items;
  }

  async listServices() {
    return this.items;
  }
}

const createAppointment = ({ id, patientId, doctorId, reason, status = 'scheduled', offsetMinutes = 30 }) => {
  const startAt = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

  return new Appointment({
    id,
    patientId,
    doctorId,
    startAt,
    endAt,
    reason,
    status,
  });
};

test('cross-role sync: patient cancel propagates to doctor schedule', async () => {
  const doctorId = 'doc-1';
  const patientId = 'pat-1';
  const appointment = createAppointment({
    id: 'apt-cross-role-1',
    patientId,
    doctorId,
    reason: 'General consultation',
    status: 'scheduled',
  });

  const patientRepository = new InMemoryPatientRepository([{ id: patientId }]);
  const doctorRepository = new InMemoryDoctorRepository([{ id: doctorId }]);
  const appointmentRepository = new InMemoryAppointmentRepository([appointment]);

  const cancelAppointmentUseCase = new CancelAppointmentUseCase({
    patientRepository,
    appointmentRepository,
    notificationService: null,
  });
  const viewDoctorScheduleUseCase = new ViewDoctorScheduleUseCase({
    doctorRepository,
    appointmentRepository,
  });

  const cancelResult = await cancelAppointmentUseCase.execute({
    patientId,
    appointmentId: appointment.id,
  });

  assert.strictEqual(cancelResult.status, 'cancelled');

  const scheduleAll = await viewDoctorScheduleUseCase.execute({
    doctorId,
    page: 1,
    pageSize: 20,
  });
  const inAll = scheduleAll.appointments.find((item) => item.id === appointment.id);
  assert.ok(inAll, 'Cancelled appointment should still be visible in doctor schedule list.');
  assert.strictEqual(inAll.getStatus(), 'cancelled');

  const scheduleCancelled = await viewDoctorScheduleUseCase.execute({
    doctorId,
    status: 'cancelled',
    page: 1,
    pageSize: 20,
  });
  assert.strictEqual(scheduleCancelled.total, 1);
  assert.strictEqual(scheduleCancelled.appointments[0].id, appointment.id);
  assert.strictEqual(scheduleCancelled.appointments[0].getStatus(), 'cancelled');
});

test('cross-role sync: doctor visit note appears in patient records', async () => {
  const doctorId = 'doc-2';
  const patientId = 'pat-2';

  const doctorRepository = new InMemoryDoctorRepository([
    { id: doctorId, fullName: 'Dr. Integration' },
  ]);
  const patientRepository = new InMemoryPatientRepository([{ id: patientId }]);
  const medicalRecordRepository = new InMemoryMedicalRecordRepository();

  const addVisitNoteUseCase = new AddVisitNoteUseCase({
    doctorRepository,
    patientRepository,
    medicalRecordRepository,
  });
  const viewMedicalRecordsUseCase = new ViewMedicalRecordsUseCase({
    patientRepository,
    medicalRecordRepository,
    doctorRepository,
  });

  await addVisitNoteUseCase.execute({
    doctorId,
    patientId,
    note: 'Benh nhan on dinh, tiep tuc theo doi 7 ngay.',
  });

  const result = await viewMedicalRecordsUseCase.execute({
    patientId,
    page: 1,
    pageSize: 20,
  });

  assert.strictEqual(result.hasRecord, true);
  assert.strictEqual(result.total, 1);
  assert.ok(result.recordId, 'Patient record metadata should include recordId.');

  const first = result.records[0];
  assert.strictEqual(first.patientId, patientId);
  assert.strictEqual(first.authorDoctorId, doctorId);
  assert.strictEqual(first.doctorName, 'Dr. Integration');
  assert.strictEqual(first.note, 'Benh nhan on dinh, tiep tuc theo doi 7 ngay.');
});

test('cross-role sync: doctor completion generates patient billing by service', async () => {
  const doctorId = 'doc-3';
  const patientId = 'pat-3';
  const appointment = createAppointment({
    id: 'apt-cross-role-3',
    patientId,
    doctorId,
    reason: 'General Consultation',
    status: 'scheduled',
  });

  const doctorRepository = new InMemoryDoctorRepository([{ id: doctorId }]);
  const patientRepository = new InMemoryPatientRepository([{ id: patientId }]);
  const appointmentRepository = new InMemoryAppointmentRepository([appointment]);
  const billingRepository = new InMemoryBillingRepository();
  const paymentRepository = new InMemoryPaymentRepository();
  const serviceCatalogRepository = new InMemoryServiceCatalogRepository([
    { id: 'svc-1', name: 'General Consultation', price: 350000 },
  ]);

  const markAppointmentStatusUseCase = new MarkAppointmentStatusUseCase({
    doctorRepository,
    appointmentRepository,
    billingRepository,
    serviceCatalogRepository,
  });
  const viewBillingAndPaymentsUseCase = new ViewBillingAndPaymentsUseCase({
    patientRepository,
    billingRepository,
    paymentRepository,
  });

  const statusResult = await markAppointmentStatusUseCase.execute({
    doctorId,
    appointmentId: appointment.id,
    status: 'completed',
  });
  assert.strictEqual(statusResult.status, 'completed');

  const billingResult = await viewBillingAndPaymentsUseCase.execute({
    patientId,
    page: 1,
    pageSize: 20,
  });

  assert.strictEqual(billingResult.billings.length, 1);
  const invoice = billingResult.billings[0];
  assert.strictEqual(invoice.status, 'issued');
  assert.strictEqual(invoice.amount, 350000);
  assert.strictEqual(invoice.serviceName, 'General Consultation');
  assert.strictEqual(invoice.charges.length, 1);
  assert.strictEqual(invoice.charges[0].appointmentId, appointment.id);

  // Marking completed again must not create a duplicate invoice for the same appointment.
  await markAppointmentStatusUseCase.execute({
    doctorId,
    appointmentId: appointment.id,
    status: 'completed',
  });

  const billingResultAfterRepeat = await viewBillingAndPaymentsUseCase.execute({
    patientId,
    page: 1,
    pageSize: 20,
  });
  assert.strictEqual(billingResultAfterRepeat.billings.length, 1);
});
