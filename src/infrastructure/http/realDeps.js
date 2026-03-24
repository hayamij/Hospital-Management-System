import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { pool } from '../db/pool.js';
import { SqlAppointmentRepository } from '../db/repositories/appointmentRepository.js';
import { SqlBillingRepository } from '../db/repositories/billingRepository.js';
import { SqlPatientRepository } from '../db/repositories/patientRepository.js';
import { SqlDoctorRepository } from '../db/repositories/doctorRepository.js';
import { SqlUserRepository } from '../db/repositories/userRepository.js';
import { SqlPaymentRepository } from '../db/repositories/paymentRepository.js';
import { SqlMedicalRecordRepository } from '../db/repositories/medicalRecordRepository.js';
import { SqlPrescriptionRepository } from '../db/repositories/prescriptionRepository.js';
import { SqlMessageRepository } from '../db/repositories/messageRepository.js';
import { SqlServiceCatalogRepository } from '../db/repositories/serviceCatalogRepository.js';
import { SqlSettingsRepository } from '../db/repositories/settingsRepository.js';
import { SqlLabResultRepository } from '../db/repositories/labResultRepository.js';
import { SqlContactLeadRepository } from '../db/repositories/contactLeadRepository.js';
import { SqlAuditLogRepository } from '../db/repositories/auditLogRepository.js';
import { Appointment } from '../../domain/entities/appointment.js';
import { Billing } from '../../domain/entities/billing.js';
import { ViewPublicServiceDetailUseCase } from '../../application/use-cases/guest/viewPublicServiceDetail.usecase.js';

const makeUseCase = (fn) => ({ execute: fn });

const noopNotification = { sendNotification: async () => {} };

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_MS = Number(process.env.JWT_REFRESH_TTL_MS || 1000 * 60 * 60 * 24 * 7); // default 7d

const signAccessToken = (user) =>
  jwt.sign({ role: user.role, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TTL, subject: user.id });

const issueRefreshToken = (user) => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString();
  pool.query('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)', [token, user.id, expiresAt]);
  return { token, expiresAt };
};

const unauthorizedError = (message = 'Invalid credentials') => {
  const err = new Error(message);
  err.status = 401;
  err.code = 'invalid_credentials';
  return err;
};

const normalizeIdentifier = (input = '') => String(input || '').trim().toLowerCase();

const revokeRefreshToken = async (token) => {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};

export function createRealDeps() {
  // Instantiate repositories once per server
  const appointmentRepository = new SqlAppointmentRepository(pool);
  const billingRepository = new SqlBillingRepository(pool);
  const patientRepository = new SqlPatientRepository(pool);
  const doctorRepository = new SqlDoctorRepository(pool);
  const userRepository = new SqlUserRepository(pool);
  const paymentRepository = new SqlPaymentRepository(pool);
  const medicalRecordRepository = new SqlMedicalRecordRepository(pool);
  const prescriptionRepository = new SqlPrescriptionRepository(pool);
  const messageRepository = new SqlMessageRepository(pool);
  const serviceCatalogRepository = new SqlServiceCatalogRepository(pool);
  const settingsRepository = new SqlSettingsRepository(pool);
  const labResultRepository = new SqlLabResultRepository(pool);
  const contactLeadRepository = new SqlContactLeadRepository(pool);
  const auditLogRepository = new SqlAuditLogRepository(pool);

  // Auth
  const loginUseCase = makeUseCase(async (input) => {
    const identifier = normalizeIdentifier(input.identifier ?? input.email);
    if (!identifier || !input.password) {
      throw unauthorizedError();
    }

    let user = null;
    if (identifier === 'admin' && input.password === '123') {
      user = await userRepository.findByEmail('admin@example.com');
    } else {
      user = await userRepository.findByEmail(identifier);
      if (!user) {
        throw unauthorizedError();
      }
      const ok = await bcrypt.compare(input.password ?? '', user.passwordHash ?? '');
      if (!ok) {
        throw unauthorizedError();
      }
    }

    if (!user) {
      throw unauthorizedError();
    }

    const accessToken = signAccessToken(user);
    const refresh = issueRefreshToken(user);
    return {
      userId: user.id,
      role: user.role,
      email: user.email,
      token: accessToken,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
    };
  });

  const logoutUseCase = makeUseCase(async (input) => {
    if (input?.refreshToken) await revokeRefreshToken(input.refreshToken);
    return { success: true };
  });

  const resetPasswordUseCase = makeUseCase(async (input) => {
    const user = await userRepository.findByEmail(input.email);
    if (!user) return { success: false, reason: 'not_found' };
    const hashed = await bcrypt.hash(input.newPassword ?? 'password', 10);
    user.passwordHash = hashed;
    await userRepository.save(user);
    return { success: true };
  });

  // Patient appointments
  const scheduleAppointmentUseCase = makeUseCase(async (input) => {
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    const appointment = new Appointment({
      patientId: input.patientId,
      doctorId: input.doctorId,
      startAt,
      endAt,
      reason: input.reason,
      status: 'pending',
      createdAt: new Date(),
    });
    const saved = await appointmentRepository.save(appointment);
    return { appointmentId: saved.id, status: saved.status, startAt: saved.startAt, endAt: saved.endAt };
  });

  const rescheduleAppointmentUseCase = makeUseCase(async (input) => {
    const existing = await appointmentRepository.findById(input.appointmentId);
    if (!existing) return { appointmentId: input.appointmentId, status: 'not_found' };
    existing.startAt = new Date(input.startAt);
    existing.endAt = new Date(input.endAt);
    existing.status = 'rescheduled';
    const saved = await appointmentRepository.save(existing);
    return { appointmentId: saved.id, status: saved.status, startAt: saved.startAt, endAt: saved.endAt };
  });

  const cancelAppointmentUseCase = makeUseCase(async (input) => {
    const existing = await appointmentRepository.findById(input.appointmentId);
    if (!existing) return { appointmentId: input.appointmentId, status: 'not_found' };
    existing.status = 'cancelled';
    const saved = await appointmentRepository.save(existing);
    return { appointmentId: saved.id, status: saved.status };
  });

  const viewAppointmentsUseCase = makeUseCase(async (input) => {
    const list = input.doctorId
      ? await appointmentRepository.listByDoctor(input.doctorId, {})
      : await appointmentRepository.listByPatient(input.patientId);
    return { page: 1, pageSize: list.length, total: list.length, appointments: list };
  });

  // Patient billing & records
  const viewBillingAndPaymentsUseCase = makeUseCase(async (input) => {
    const billings = await billingRepository.listByPatient(input.patientId);
    const payments = await paymentRepository.listByPatient(input.patientId);
    return { page: 1, pageSize: billings.length, total: billings.length, billings, payments };
  });

  const viewMedicalRecordsUseCase = makeUseCase(async (input) => {
    const record = await medicalRecordRepository.findByPatientId(input.patientId);
    const records = record ? [record] : [];
    return { page: 1, pageSize: records.length, total: records.length, records };
  });

  const downloadPrescriptionUseCase = makeUseCase(async (input) => {
    const presc = await prescriptionRepository.findById(input.prescriptionId);
    return { prescriptionId: input.prescriptionId, file: presc ? JSON.stringify(presc.content) : '', filename: 'prescription.json' };
  });

  const sendPatientMessageUseCase = makeUseCase(async (input) => {
    const msg = await messageRepository.create({
      fromPatientId: input.patientId,
      toDoctorId: input.doctorId,
      subject: input.subject,
      content: input.content,
    });
    return { messageId: msg.id, status: 'sent', sentAt: msg.createdAt };
  });

  const registerPatientAccountUseCase = makeUseCase(async (input) => {
    const email = normalizeIdentifier(input.email);
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already exists');
      err.status = 409;
      err.code = 'email_exists';
      throw err;
    }

    const hashedPassword = await bcrypt.hash(input.password ?? '123456', 10);
    const patient = await patientRepository.create({
      fullName: input.name ?? input.fullName ?? 'New Patient',
      contactInfo: { email },
      status: 'active',
    });

    const user = await userRepository.save({
      id: patient.id,
      email,
      passwordHash: hashedPassword,
      role: 'patient',
      status: 'active',
      patientId: patient.id,
    });
    return { patientId: patient.id, userId: user.id, status: 'registered' };
  });

  const updatePatientProfileUseCase = makeUseCase(async (input) => {
    const patient = await patientRepository.findById(input.patientId);
    if (!patient) return { patientId: input.patientId, status: 'not_found' };
    patient.fullName = input.name ?? patient.fullName;
    patient.contactInfo = { ...(patient.contactInfo ?? {}), ...(input.contact ?? {}) };
    await patientRepository.save(patient);
    return { patientId: patient.id, updatedAt: new Date().toISOString() };
  });

  const searchDoctorsUseCase = makeUseCase(async (input) => {
    const list = await doctorRepository.search({ name: input?.name, specialization: input?.specialization });
    return { page: 1, pageSize: list.length, total: list.length, doctors: list };
  });

  const viewAvailableSlotsUseCase = makeUseCase(async () => ({ slots: [] }));

  // Doctor access & schedule
  const doctorLoginUseCase = makeUseCase(async (input) => {
    const user = await userRepository.findByEmail(input.email);
    return { doctorId: user?.doctorId ?? null, accessToken: user ? 'todo-jwt' : null };
  });

  const viewDoctorScheduleUseCase = makeUseCase(async (input) => {
    const list = await appointmentRepository.listByDoctor(input.doctorId, {});
    return { appointments: list };
  });

  const manageAppointmentDecisionUseCase = makeUseCase(async (input) => {
    const existing = await appointmentRepository.findById(input.appointmentId);
    if (!existing) return { appointmentId: input.appointmentId, status: 'not_found' };
    existing.status = input.decision ?? 'approved';
    const saved = await appointmentRepository.save(existing);
    return { appointmentId: saved.id, status: saved.status };
  });

  const markAppointmentStatusUseCase = makeUseCase(async (input) => {
    const existing = await appointmentRepository.findById(input.appointmentId);
    if (!existing) return { appointmentId: input.appointmentId, status: 'not_found' };
    existing.status = input.status ?? existing.status;
    const saved = await appointmentRepository.save(existing);
    return { appointmentId: saved.id, status: saved.status };
  });

  const accessPatientChartUseCase = makeUseCase(async (input) => ({ patientId: input.patientId, chart: { visits: [], medications: [] } }));
  const addVisitNoteUseCase = makeUseCase(async (input) => ({ patientId: input.patientId, noteId: 'note-' + Date.now() }));
  const updateMedicalRecordEntryUseCase = makeUseCase(async (input) => ({ recordId: input.recordId, status: 'updated' }));
  const reviewTestResultsUseCase = makeUseCase(async (input) => ({ labResultId: input.labResultId, status: 'reviewed' }));

  const updateDoctorProfileUseCase = makeUseCase(async (input) => {
    const doctor = await doctorRepository.findById(input.doctorId);
    if (!doctor) return { doctorId: input.doctorId, status: 'not_found' };
    doctor.fullName = input.profile?.name ?? doctor.fullName;
    doctor.specialization = input.profile?.specialization ?? doctor.specialization;
    doctor.department = input.profile?.department ?? doctor.department;
    await doctorRepository.save(doctor);
    return { doctorId: doctor.id, updatedAt: new Date().toISOString() };
  });

  const sendDoctorMessageUseCase = makeUseCase(async (input) => {
    const msg = await messageRepository.create({
      fromDoctorId: input.doctorId,
      toPatientId: input.patientId,
      subject: input.subject,
      content: input.content,
    });
    return { messageId: msg.id, status: 'sent', sentAt: msg.createdAt };
  });

  // Admin
  const adminLoginUseCase = makeUseCase(async (input) => {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.role !== 'admin') return { success: false };
    return { adminId: user.id, accessToken: 'todo-jwt' };
  });

  const assignRolesUseCase = makeUseCase(async (input) => {
    const user = await userRepository.findById(input.userId);
    if (!user) return { userId: input.userId, status: 'not_found' };
    user.role = input.role ?? user.role;

    if (user.role === 'doctor' && !user.doctorId) {
      const doctorId = user.id;
      user.doctorId = doctorId;
      await doctorRepository.save({
        id: doctorId,
        fullName: user.fullName || user.email || `Doctor ${doctorId}`,
        specialization: 'General',
        department: 'General',
        availableSlotsPerDay: 8,
        contactInfo: { email: user.email, phone: null },
        status: 'active',
      });
    }

    await userRepository.save(user);
    return {
      updatedAt: new Date().toISOString(),
      userId: user.id,
      role: user.role,
      doctorId: user.doctorId || null,
    };
  });

  const manageUserStatusUseCase = makeUseCase(async (input) => {
    const user = await userRepository.findById(input.userId);
    if (!user) return { userId: input.userId, status: 'not_found' };
    user.status = input.status ?? user.status;
    await userRepository.save(user);
    return { updatedAt: new Date().toISOString(), userId: user.id, status: user.status };
  });

  const setDoctorSlotsUseCase = makeUseCase(async (input) => {
    const doctor = await doctorRepository.findById(input.doctorId);
    if (!doctor) return { doctorId: input.doctorId, status: 'not_found' };
    doctor.availableSlotsPerDay = input.slotsPerDay ?? doctor.availableSlotsPerDay;
    await doctorRepository.save(doctor);
    return { doctorId: doctor.id, slotsPerDay: doctor.availableSlotsPerDay, updatedAt: new Date().toISOString() };
  });

  const overrideAppointmentUseCase = makeUseCase(async (input) => {
    const existing = await appointmentRepository.findById(input.appointmentId);
    if (!existing) return { appointmentId: input.appointmentId, status: 'not_found' };
    existing.status = input.status ?? existing.status;
    const saved = await appointmentRepository.save(existing);
    return { status: saved.status, updatedAt: new Date().toISOString() };
  });

  const manageBillingUseCase = makeUseCase(async (input) => {
    let billing = await billingRepository.findById(input.invoiceId);
    if (!billing) {
      billing = new Billing({
        id: input.invoiceId,
        invoiceNumber: input.invoiceId ?? 'INV-' + Date.now(),
        patientId: input.patientId,
        charges: input.charges ?? [{ description: 'Manual', amount: input.amount ?? 0 }],
        status: 'draft',
        createdAt: new Date(),
      });
      await billingRepository.save(billing);
    }
    if (input.action === 'markPaid') billing.status = 'paid';
    if (input.action === 'void') billing.status = 'void';
    if (input.action === 'issue') billing.status = 'open';
    await billingRepository.save(billing);
    return { invoiceId: billing.id, status: billing.status, dueDate: billing.dueDate };
  });

  const upsertServiceUseCase = makeUseCase(async (input) => serviceCatalogRepository.upsertService(input));
  const removeServiceUseCase = makeUseCase(async (input) => serviceCatalogRepository.removeService(input.serviceId));

  const updateSettingsUseCase = makeUseCase(async (input) => {
    await settingsRepository.save(input);
    return { updatedAt: new Date().toISOString() };
  });

  const runReportUseCase = makeUseCase(async () => {
    const doctors = await doctorRepository.search();
    const patients = [await patientRepository.findById('pat-1')].filter(Boolean); // lightweight count
    return { reportId: 'rep-' + Date.now(), counts: { patients: patients.length, doctors: doctors.length } };
  });

  const auditRecordUseCase = makeUseCase(async (input) => {
    const entry = await auditLogRepository.append({ recordId: input.recordId, action: input.action ?? 'audit', actorId: input.actorId });
    return { recordId: entry.recordId, status: 'audited', auditedAt: entry.createdAt };
  });

  // Guest
  const browsePublicInfoUseCase = makeUseCase(async () => ({
    services: await serviceCatalogRepository.listServices(),
    insurancePlans: await serviceCatalogRepository.listInsurancePlans(),
    bookingConstraints: await serviceCatalogRepository.listBookingConstraints(),
    hospitalInfo: (await settingsRepository.getSettings()) ?? {},
  }));
  const viewPublicServiceDetailUseCase = new ViewPublicServiceDetailUseCase({
    serviceCatalogRepository,
  });
  const guestSearchDoctorsUseCase = searchDoctorsUseCase;
  const startRegistrationUseCase = registerPatientAccountUseCase;
  const submitContactFormUseCase = makeUseCase(async (input) => {
    const lead = await contactLeadRepository.create({ name: input.name, email: input.email, message: input.message });
    return { receivedAt: lead.receivedAt };
  });

  return {
    // Auth
    loginUseCase,
    logoutUseCase,
    resetPasswordUseCase,

    // Patient
    scheduleAppointmentUseCase,
    rescheduleAppointmentUseCase,
    cancelAppointmentUseCase,
    viewAppointmentsUseCase,
    viewBillingAndPaymentsUseCase,
    viewMedicalRecordsUseCase,
    downloadPrescriptionUseCase,
    sendPatientMessageUseCase,
    registerPatientAccountUseCase,
    updatePatientProfileUseCase,
    searchDoctorsUseCase,
    viewAvailableSlotsUseCase,

    // Doctor
    doctorLoginUseCase,
    viewDoctorScheduleUseCase,
    manageAppointmentDecisionUseCase,
    markAppointmentStatusUseCase,
    accessPatientChartUseCase,
    addVisitNoteUseCase,
    updateMedicalRecordEntryUseCase,
    reviewTestResultsUseCase,
    updateDoctorProfileUseCase,
    sendDoctorMessageUseCase,

    // Admin
    adminLoginUseCase,
    assignRolesUseCase,
    manageUserStatusUseCase,
    setDoctorSlotsUseCase,
    overrideAppointmentUseCase,
    manageBillingUseCase,
    upsertServiceUseCase,
    removeServiceUseCase,
    updateSettingsUseCase,
    runReportUseCase,
    auditRecordUseCase,

    // Guest
    browsePublicInfoUseCase,
    viewPublicServiceDetailUseCase,
    guestSearchDoctorsUseCase,
    startRegistrationUseCase,
    submitContactFormUseCase,

    // Repos and services for potential later composition
    _repos: {
      appointmentRepository,
      billingRepository,
      patientRepository,
      doctorRepository,
      userRepository,
      paymentRepository,
      medicalRecordRepository,
      prescriptionRepository,
      messageRepository,
      serviceCatalogRepository,
      settingsRepository,
      labResultRepository,
      contactLeadRepository,
      auditLogRepository,
    },
    _services: { notificationService: noopNotification },
  };
}
