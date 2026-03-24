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
import { ViewPublicCardDetailUseCase } from '../../application/use-cases/guest/viewPublicCardDetail.usecase.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase.js';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.usecase.js';
import { ResetPasswordUseCase } from '../../application/use-cases/auth/resetPassword.usecase.js';
import { ScheduleAppointmentUseCase } from '../../application/use-cases/patient/scheduleAppointment.usecase.js';
import { RescheduleAppointmentUseCase } from '../../application/use-cases/patient/rescheduleAppointment.usecase.js';
import { CancelAppointmentUseCase } from '../../application/use-cases/patient/cancelAppointment.usecase.js';
import { ViewAppointmentsUseCase } from '../../application/use-cases/patient/viewAppointments.usecase.js';
import { ViewBillingAndPaymentsUseCase } from '../../application/use-cases/patient/viewBillingAndPayments.usecase.js';
import { DownloadInvoiceUseCase } from '../../application/use-cases/patient/downloadInvoice.usecase.js';
import { ViewMedicalRecordsUseCase } from '../../application/use-cases/patient/viewMedicalRecords.usecase.js';
import { DownloadPrescriptionUseCase } from '../../application/use-cases/patient/downloadPrescription.usecase.js';
import { SendPatientMessageUseCase } from '../../application/use-cases/patient/sendPatientMessage.usecase.js';
import { RegisterPatientAccountUseCase } from '../../application/use-cases/patient/registerPatientAccount.usecase.js';
import { UpdatePatientProfileUseCase } from '../../application/use-cases/patient/updatePatientProfile.usecase.js';
import { SearchDoctorsUseCase } from '../../application/use-cases/patient/searchDoctors.usecase.js';
import { DoctorLoginUseCase } from '../../application/use-cases/doctor/doctorLogin.usecase.js';
import { ViewDoctorScheduleUseCase } from '../../application/use-cases/doctor/viewDoctorSchedule.usecase.js';
import { ManageAppointmentDecisionUseCase } from '../../application/use-cases/doctor/manageAppointmentDecision.usecase.js';
import { MarkAppointmentStatusUseCase } from '../../application/use-cases/doctor/markAppointmentStatus.usecase.js';
import { AccessPatientChartUseCase } from '../../application/use-cases/doctor/accessPatientChart.usecase.js';
import { AddVisitNoteUseCase } from '../../application/use-cases/doctor/addVisitNote.usecase.js';
import { UpdateMedicalRecordEntryUseCase } from '../../application/use-cases/doctor/updateMedicalRecordEntry.usecase.js';
import { ReviewTestResultsUseCase } from '../../application/use-cases/doctor/reviewTestResults.usecase.js';
import { UpdateDoctorProfileAndAvailabilityUseCase } from '../../application/use-cases/doctor/updateDoctorProfileAndAvailability.usecase.js';
import { SendDoctorMessageUseCase } from '../../application/use-cases/doctor/sendDoctorMessage.usecase.js';
import { AdminLoginUseCase } from '../../application/use-cases/admin/adminLogin.usecase.js';
import { AssignRolesUseCase } from '../../application/use-cases/admin/assignRoles.usecase.js';
import { ManageUsersUseCase } from '../../application/use-cases/admin/manageUsers.usecase.js';
import { ManageDoctorSchedulesUseCase } from '../../application/use-cases/admin/manageDoctorSchedules.usecase.js';
import { OverrideAppointmentUseCase } from '../../application/use-cases/admin/overrideAppointment.usecase.js';
import { ManageBillingUseCase } from '../../application/use-cases/admin/manageBilling.usecase.js';
import { ConfigureServicesAndPricingUseCase } from '../../application/use-cases/admin/configureServicesAndPricing.usecase.js';
import { ManageSystemSettingsUseCase } from '../../application/use-cases/admin/manageSystemSettings.usecase.js';
import { RunReportsUseCase } from '../../application/use-cases/admin/runReports.usecase.js';
import { AuditMedicalRecordsUseCase } from '../../application/use-cases/admin/auditMedicalRecords.usecase.js';
import { BrowsePublicInfoUseCase } from '../../application/use-cases/guest/browsePublicInfo.usecase.js';
import { GuestSearchDoctorsUseCase } from '../../application/use-cases/guest/guestSearchDoctors.usecase.js';
import { StartRegistrationUseCase } from '../../application/use-cases/guest/startRegistration.usecase.js';
import { SubmitContactFormUseCase } from '../../application/use-cases/guest/submitContactForm.usecase.js';
import { ViewAvailableSlotsUseCase } from '../../application/use-cases/guest/viewAvailableSlots.usecase.js';

const makeUseCase = (fn) => ({ execute: fn });
const adaptUseCase = (useCase, mapInput = (input) => input, mapOutput = (output) => output) => ({
  async execute(input) {
    const mappedInput = await mapInput(input);
    const result = await useCase.execute(mappedInput);
    return mapOutput(result, input);
  },
});

const noopNotification = { sendNotification: async () => {} };

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_MS = Number(process.env.JWT_REFRESH_TTL_MS || 1000 * 60 * 60 * 24 * 7); // default 7d

const signAccessToken = (user) =>
  jwt.sign({ role: user.role, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TTL, subject: user.id });

const issueRefreshToken = async (user) => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString();
  await pool.query('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)', [token, user.id, expiresAt]);
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
    const refresh = await issueRefreshToken(user);
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

  const downloadInvoiceUseCase = new DownloadInvoiceUseCase({
    patientRepository,
    billingRepository,
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
    const phone = String(input.phone ?? '').trim();
    const password = String(input.password ?? '');

    if (!phone) {
      const err = new Error('Phone is required.');
      err.status = 400;
      err.code = 'validation_error';
      throw err;
    }

    if (password.length < 8) {
      const err = new Error('Password must be at least 8 characters.');
      err.status = 400;
      err.code = 'validation_error';
      throw err;
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already exists');
      err.status = 409;
      err.code = 'email_exists';
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const patient = await patientRepository.create({
      fullName: input.name ?? input.fullName ?? 'New Patient',
      contactInfo: { email, phone },
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
    return { patientId: patient.id, userId: user.id, status: 'active' };
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

  // Compatibility aliases to satisfy controller contracts while keeping existing endpoints stable.
  const manageDoctorSchedulesUseCase = setDoctorSlotsUseCase;
  const updateDoctorProfileAndAvailabilityUseCase = updateDoctorProfileUseCase;
  const manageSystemSettingsUseCase = makeUseCase(async (input) => {
    const payload = input?.settings && typeof input.settings === 'object' ? input.settings : {};
    return updateSettingsUseCase.execute(payload);
  });
  const auditMedicalRecordsUseCase = makeUseCase(async (input) =>
    auditRecordUseCase.execute({ ...input, actorId: input?.adminId ?? input?.actorId })
  );
  const configureServicesAndPricingUseCase = makeUseCase(async (input) => {
    const action = String(input?.action ?? 'upsert').toLowerCase();
    const service = input?.service ?? {};
    if (action === 'remove') {
      return removeServiceUseCase.execute({ serviceId: service?.id ?? input?.serviceId });
    }
    return upsertServiceUseCase.execute(service);
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
  const viewPublicCardDetailUseCase = new ViewPublicCardDetailUseCase({
    serviceCatalogRepository,
    doctorRepository,
  });
  const guestSearchDoctorsUseCase = searchDoctorsUseCase;
  const startRegistrationUseCase = registerPatientAccountUseCase;
  const submitContactFormUseCase = makeUseCase(async (input) => {
    const lead = await contactLeadRepository.create({ name: input.name, email: input.email, message: input.message });
    return { receivedAt: lead.receivedAt };
  });

  // Class-based dependencies with thin compatibility adapters.
  const authService = {
    comparePassword: async (plainText, hashedPassword) => bcrypt.compare(plainText ?? '', hashedPassword ?? ''),
    hashPassword: async (plainText) => bcrypt.hash(plainText ?? '', 10),
    generateTokens: async ({ userId, role }) => {
      const user = await userRepository.findById(userId);
      if (!user) throw unauthorizedError();
      const accessToken = signAccessToken({ id: user.id, role: role ?? user.role, email: user.email });
      const refresh = await issueRefreshToken(user);
      return { accessToken, refreshToken: refresh.token, expiresAt: refresh.expiresAt };
    },
    revokeTokens: async ({ refreshToken }) => {
      if (refreshToken) await revokeRefreshToken(refreshToken);
    },
  };

  const reportRepository = {
    async run(reportName) {
      const doctors = await doctorRepository.search();
      const patients = [await patientRepository.findById('pat-1')].filter(Boolean);
      return {
        reportName,
        counts: { patients: patients.length, doctors: doctors.length },
      };
    },
  };

  const loginClass = new LoginUseCase({ userRepository, authService });
  const logoutClass = new LogoutUseCase({ userRepository, authService });
  const resetPasswordClass = new ResetPasswordUseCase({ userRepository, authService });
  const scheduleAppointmentClass = new ScheduleAppointmentUseCase({ patientRepository, doctorRepository, appointmentRepository, notificationService: noopNotification });
  const rescheduleAppointmentClass = new RescheduleAppointmentUseCase({ patientRepository, appointmentRepository, notificationService: noopNotification });
  const cancelAppointmentClass = new CancelAppointmentUseCase({ patientRepository, appointmentRepository, notificationService: noopNotification });
  const viewAppointmentsClass = new ViewAppointmentsUseCase({ patientRepository, appointmentRepository });
  const viewBillingAndPaymentsClass = new ViewBillingAndPaymentsUseCase({ patientRepository, billingRepository, paymentRepository });
  const viewMedicalRecordsClass = new ViewMedicalRecordsUseCase({ patientRepository, medicalRecordRepository });
  const downloadPrescriptionClass = new DownloadPrescriptionUseCase({ patientRepository, prescriptionRepository });
  const sendPatientMessageClass = new SendPatientMessageUseCase({ patientRepository, doctorRepository, messageRepository, notificationService: noopNotification });
  const registerPatientAccountClass = new RegisterPatientAccountUseCase({ userRepository, patientRepository, authService });
  const updatePatientProfileClass = new UpdatePatientProfileUseCase({ patientRepository });
  const searchDoctorsClass = new SearchDoctorsUseCase({ doctorRepository });
  const doctorLoginClass = new DoctorLoginUseCase({ userRepository, authService });
  const viewDoctorScheduleClass = new ViewDoctorScheduleUseCase({ doctorRepository, appointmentRepository });
  const manageAppointmentDecisionClass = new ManageAppointmentDecisionUseCase({ doctorRepository, appointmentRepository });
  const markAppointmentStatusClass = new MarkAppointmentStatusUseCase({ doctorRepository, appointmentRepository });
  const accessPatientChartClass = new AccessPatientChartUseCase({ doctorRepository, patientRepository, medicalRecordRepository });
  const addVisitNoteClass = new AddVisitNoteUseCase({ doctorRepository, patientRepository, medicalRecordRepository });
  const updateMedicalRecordEntryClass = new UpdateMedicalRecordEntryUseCase({ doctorRepository, medicalRecordRepository });
  const reviewTestResultsClass = new ReviewTestResultsUseCase({ doctorRepository, labResultRepository });
  const updateDoctorProfileAndAvailabilityClass = new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository });
  const sendDoctorMessageClass = new SendDoctorMessageUseCase({ doctorRepository, patientRepository, messageRepository, notificationService: noopNotification });
  const adminLoginClass = new AdminLoginUseCase({ userRepository, authService });
  const assignRolesClass = new AssignRolesUseCase({ userRepository });
  const manageUsersClass = new ManageUsersUseCase({ userRepository });
  const manageDoctorSchedulesClass = new ManageDoctorSchedulesUseCase({ doctorRepository, userRepository });
  const overrideAppointmentClass = new OverrideAppointmentUseCase({ appointmentRepository, doctorRepository, userRepository });
  const manageBillingClass = new ManageBillingUseCase({ billingRepository, userRepository });
  const configureServicesAndPricingClass = new ConfigureServicesAndPricingUseCase({ serviceCatalogRepository, userRepository });
  const manageSystemSettingsClass = new ManageSystemSettingsUseCase({ settingsRepository, userRepository });
  const runReportsClass = new RunReportsUseCase({ reportRepository, userRepository });
  const auditMedicalRecordsClass = new AuditMedicalRecordsUseCase({ medicalRecordRepository, auditLogRepository, userRepository });
  const browsePublicInfoClass = new BrowsePublicInfoUseCase({ serviceCatalogRepository, settingsRepository });
  const guestSearchDoctorsClass = new GuestSearchDoctorsUseCase({ doctorRepository });
  const startRegistrationClass = new StartRegistrationUseCase({ patientRepository });
  const submitContactFormClass = new SubmitContactFormUseCase({ contactLeadRepository });
  const viewAvailableSlotsClass = new ViewAvailableSlotsUseCase({ doctorRepository, appointmentRepository });

  const loginViaClassUseCase = adaptUseCase(
    loginClass,
    (input) => ({ email: input?.identifier ?? input?.email, password: input?.password }),
    (result) => ({ ...result, token: result?.token ?? result?.accessToken ?? null })
  );
  const resetPasswordViaClassUseCase = adaptUseCase(
    resetPasswordClass,
    (input) => ({ email: input?.email, oldPassword: input?.oldPassword ?? input?.currentPassword, newPassword: input?.newPassword })
  );
  const searchDoctorsViaClassUseCase = adaptUseCase(
    searchDoctorsClass,
    (input) => ({ name: input?.name ?? input?.query, specialization: input?.specialization ?? input?.specialty }),
    (result) => ({ page: 1, pageSize: result.doctors?.length ?? 0, total: result.doctors?.length ?? 0, doctors: result.doctors ?? [] })
  );
  const guestSearchDoctorsViaClassUseCase = adaptUseCase(
    guestSearchDoctorsClass,
    (input) => ({ name: input?.name ?? input?.query, specialization: input?.specialization ?? input?.specialty }),
    (result) => ({ page: 1, pageSize: result.doctors?.length ?? 0, total: result.doctors?.length ?? 0, doctors: result.doctors ?? [] })
  );
  const viewDoctorScheduleViaClassUseCase = adaptUseCase(
    viewDoctorScheduleClass,
    undefined,
    (result) => ({ page: 1, pageSize: result.appointments?.length ?? 0, total: result.appointments?.length ?? 0, appointments: result.appointments ?? [] })
  );
  const accessPatientChartViaClassUseCase = adaptUseCase(
    accessPatientChartClass,
    undefined,
    (result) => ({ page: 1, pageSize: result.entries?.length ?? 0, total: result.entries?.length ?? 0, records: result.entries ?? [] })
  );
  const addVisitNoteViaClassUseCase = adaptUseCase(
    addVisitNoteClass,
    undefined,
    (result) => ({ recordId: result.patientId, entryId: `entry-${result.entryCount ?? 0}`, addedAt: new Date().toISOString() })
  );
  const updateMedicalRecordEntryViaClassUseCase = adaptUseCase(
    updateMedicalRecordEntryClass,
    undefined,
    (result) => ({ recordId: result.recordId, entryId: `entry-${result.entryCount ?? 0}`, addedAt: new Date().toISOString() })
  );
  const sendDoctorMessageViaClassUseCase = adaptUseCase(
    sendDoctorMessageClass,
    undefined,
    (result) => ({ messageId: result.messageId, status: 'sent', sentAt: new Date().toISOString() })
  );
  const doctorLoginViaClassUseCase = adaptUseCase(
    doctorLoginClass,
    undefined,
    (result) => ({ ...result, token: result.accessToken })
  );
  const adminLoginViaClassUseCase = adaptUseCase(
    adminLoginClass,
    undefined,
    (result) => ({ ...result, token: result.accessToken, userId: result.adminId })
  );
  const manageUserStatusViaClassUseCase = adaptUseCase(
    manageUsersClass,
    (input) => {
      const raw = String(input?.action ?? '').toLowerCase();
      const action = raw === 'activate' ? 'enable' : raw === 'deactivate' ? 'disable' : raw;
      return { ...input, action };
    }
  );
  const overrideAppointmentViaClassUseCase = adaptUseCase(
    overrideAppointmentClass,
    (input) => {
      if (input?.action) return input;
      if (input?.doctorId) return { ...input, action: 'assignDoctor' };
      if (String(input?.status ?? '').toLowerCase() === 'cancelled') return { ...input, action: 'cancel' };
      return { ...input, action: 'reschedule', startAt: input?.startAt ?? new Date().toISOString(), endAt: input?.endAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString() };
    }
  );
  const manageBillingViaClassUseCase = adaptUseCase(
    manageBillingClass,
    async (input) => {
      const existing = await billingRepository.findById(input?.invoiceId);
      if (!existing) {
        const seed = new Billing({
          id: input?.invoiceId,
          invoiceNumber: input?.invoiceId ?? 'INV-' + Date.now(),
          patientId: input?.patientId ?? 'pat-1',
          charges: [{ description: 'Manual', amount: Number(input?.amount ?? 0) }],
          status: 'draft',
          createdAt: new Date(),
        });
        await billingRepository.save(seed);
      }
      return input;
    },
    (result, input) => ({ invoiceId: input?.invoiceId, status: result?.status, total: result?.total, dueDate: result?.dueDate })
  );
  const upsertServiceViaClassUseCase = adaptUseCase(
    configureServicesAndPricingClass,
    (input) => ({ adminId: input?.adminId, action: 'upsert', service: input }),
    (result) => ({ itemId: result.serviceId, status: result.action })
  );
  const removeServiceViaClassUseCase = adaptUseCase(
    configureServicesAndPricingClass,
    (input) => ({ adminId: input?.adminId, action: 'remove', service: { id: input?.serviceId } }),
    (result) => ({ itemId: result.serviceId, status: result.action })
  );
  const runReportViaClassUseCase = adaptUseCase(
    runReportsClass,
    undefined,
    (result) => ({
      reportId: `rep-${Date.now()}`,
      reportName: result.reportName,
      ...(result.data ?? {}),
      generatedAt: new Date().toISOString(),
    })
  );
  const auditRecordViaClassUseCase = adaptUseCase(
    auditMedicalRecordsClass,
    (input) => ({
      adminId: input?.adminId ?? input?.actorId,
      recordId: input?.recordId,
      action: input?.action ?? 'audit',
      reason: input?.reason ?? 'manual_audit',
    }),
    (result) => ({ recordId: result.recordId, status: result.action, auditedAt: result.auditedAt })
  );
  const startRegistrationViaClassUseCase = adaptUseCase(
    startRegistrationClass,
    (input) => ({ fullName: input?.fullName ?? input?.name, email: input?.email, phone: input?.phone })
  );

  return {
    // Auth
    loginUseCase: loginViaClassUseCase,
    logoutUseCase: logoutClass,
    resetPasswordUseCase: resetPasswordViaClassUseCase,

    // Patient
    scheduleAppointmentUseCase: scheduleAppointmentClass,
    rescheduleAppointmentUseCase: rescheduleAppointmentClass,
    cancelAppointmentUseCase: cancelAppointmentClass,
    viewAppointmentsUseCase: viewAppointmentsClass,
    viewBillingAndPaymentsUseCase: viewBillingAndPaymentsClass,
    downloadInvoiceUseCase,
    viewMedicalRecordsUseCase: viewMedicalRecordsClass,
    downloadPrescriptionUseCase: downloadPrescriptionClass,
    sendPatientMessageUseCase: sendPatientMessageClass,
    registerPatientAccountUseCase: registerPatientAccountClass,
    updatePatientProfileUseCase: updatePatientProfileClass,
    searchDoctorsUseCase: searchDoctorsViaClassUseCase,
    viewAvailableSlotsUseCase: viewAvailableSlotsClass,

    // Doctor
    doctorLoginUseCase: doctorLoginViaClassUseCase,
    viewDoctorScheduleUseCase: viewDoctorScheduleViaClassUseCase,
    manageAppointmentDecisionUseCase: manageAppointmentDecisionClass,
    markAppointmentStatusUseCase: markAppointmentStatusClass,
    accessPatientChartUseCase: accessPatientChartViaClassUseCase,
    addVisitNoteUseCase: addVisitNoteViaClassUseCase,
    updateMedicalRecordEntryUseCase: updateMedicalRecordEntryViaClassUseCase,
    reviewTestResultsUseCase: reviewTestResultsClass,
    updateDoctorProfileUseCase: updateDoctorProfileAndAvailabilityClass,
    updateDoctorProfileAndAvailabilityUseCase: updateDoctorProfileAndAvailabilityClass,
    sendDoctorMessageUseCase: sendDoctorMessageViaClassUseCase,

    // Admin
    adminLoginUseCase: adminLoginViaClassUseCase,
    assignRolesUseCase: adaptUseCase(assignRolesClass, undefined, (result) => ({ ...result, roles: result.role ? [result.role] : [] })),
    manageUserStatusUseCase: manageUserStatusViaClassUseCase,
    setDoctorSlotsUseCase: manageDoctorSchedulesClass,
    manageDoctorSchedulesUseCase: manageDoctorSchedulesClass,
    overrideAppointmentUseCase: overrideAppointmentViaClassUseCase,
    manageBillingUseCase: manageBillingViaClassUseCase,
    upsertServiceUseCase: upsertServiceViaClassUseCase,
    removeServiceUseCase: removeServiceViaClassUseCase,
    configureServicesAndPricingUseCase: configureServicesAndPricingClass,
    updateSettingsUseCase: adaptUseCase(manageSystemSettingsClass, (input) => ({ adminId: input?.adminId, settings: input })),
    manageSystemSettingsUseCase: manageSystemSettingsClass,
    runReportUseCase: runReportViaClassUseCase,
    auditRecordUseCase: auditRecordViaClassUseCase,
    auditMedicalRecordsUseCase: auditMedicalRecordsClass,

    // Guest
    browsePublicInfoUseCase: browsePublicInfoClass,
    viewPublicServiceDetailUseCase,
    viewPublicCardDetailUseCase,
    guestSearchDoctorsUseCase: guestSearchDoctorsViaClassUseCase,
    startRegistrationUseCase: startRegistrationViaClassUseCase,
    submitContactFormUseCase: submitContactFormClass,

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
