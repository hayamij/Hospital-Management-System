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
import { Billing } from '../../domain/entities/billing.js';
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
import { createAuthService, createAuthUseCases } from './contexts/authContext.js';
import { createPatientUseCases } from './contexts/patientContext.js';
import { createDoctorUseCases } from './contexts/doctorContext.js';
import { createAdminUseCases } from './contexts/adminContext.js';
import { createGuestUseCases } from './contexts/guestContext.js';
import { adaptUseCase, noopNotification } from './contexts/common.js';

export function createRealDeps() {
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

  const authService = createAuthService({ userRepository, pool });

  const authUseCases = createAuthUseCases({
    userRepository,
    authService,
  });

  const patientUseCases = createPatientUseCases({
    patientRepository,
    doctorRepository,
    appointmentRepository,
    billingRepository,
    paymentRepository,
    medicalRecordRepository,
    prescriptionRepository,
    messageRepository,
    userRepository,
    authService,
  });

  const doctorUseCases = createDoctorUseCases({
    userRepository,
    doctorRepository,
    patientRepository,
    appointmentRepository,
    medicalRecordRepository,
    messageRepository,
    labResultRepository,
    authService,
  });

  const adminUseCases = createAdminUseCases({
    userRepository,
    doctorRepository,
    appointmentRepository,
    billingRepository,
    medicalRecordRepository,
    serviceCatalogRepository,
    settingsRepository,
    reportRepository: {
      async run(reportName) {
        const doctors = await doctorRepository.search();
        const patients = [await patientRepository.findById('pat-1')].filter(Boolean);
        return {
          reportName,
          counts: { patients: patients.length, doctors: doctors.length },
        };
      },
    },
    auditLogRepository,
    authService,
  });

  const guestUseCases = createGuestUseCases({
    serviceCatalogRepository,
    settingsRepository,
    doctorRepository,
    patientRepository,
    contactLeadRepository,
  });

  const assignRolesUseCase = adaptUseCase(
    new AssignRolesUseCase({ userRepository }),
    undefined,
    (result) => ({ ...result, roles: result.role ? [result.role] : [] })
  );

  const manageUserStatusUseCase = adaptUseCase(
    new ManageUsersUseCase({ userRepository }),
    (input) => {
      const raw = String(input?.action ?? '').toLowerCase();
      const action = raw === 'activate' ? 'enable' : raw === 'deactivate' ? 'disable' : raw;
      return { ...input, action };
    }
  );

  const manageDoctorSchedulesUseCase = new ManageDoctorSchedulesUseCase({
    doctorRepository,
    userRepository,
  });

  const overrideAppointmentUseCase = adaptUseCase(
    new OverrideAppointmentUseCase({
      appointmentRepository,
      doctorRepository,
      userRepository,
    }),
    (input) => {
      if (input?.action) return input;
      if (input?.doctorId) return { ...input, action: 'assignDoctor' };
      if (String(input?.status ?? '').toLowerCase() === 'cancelled') {
        return { ...input, action: 'cancel' };
      }
      return {
        ...input,
        action: 'reschedule',
        startAt: input?.startAt ?? new Date().toISOString(),
        endAt:
          input?.endAt ??
          new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    }
  );

  const manageBillingUseCase = adaptUseCase(
    new ManageBillingUseCase({ billingRepository, userRepository }),
    async (input) => {
      const existing = await billingRepository.findById(input?.invoiceId);
      if (!existing) {
        const seed = new Billing({
          id: input?.invoiceId,
          invoiceNumber: input?.invoiceId ?? `INV-${Date.now()}`,
          patientId: input?.patientId ?? 'pat-1',
          charges: [{ description: 'Manual', amount: Number(input?.amount ?? 0) }],
          status: 'draft',
          createdAt: new Date(),
        });
        await billingRepository.save(seed);
      }
      return input;
    },
    (result, input) => ({
      invoiceId: input?.invoiceId,
      status: result?.status,
      total: result?.total,
      dueDate: result?.dueDate,
    })
  );

  const configureServicesAndPricingUseCase = new ConfigureServicesAndPricingUseCase({
    serviceCatalogRepository,
    userRepository,
  });

  const manageSystemSettingsUseCase = new ManageSystemSettingsUseCase({
    settingsRepository,
    userRepository,
  });

  const runReportUseCase = adaptUseCase(
    new RunReportsUseCase({
      reportRepository: {
        async run(reportName) {
          const doctors = await doctorRepository.search();
          const patients = [await patientRepository.findById('pat-1')].filter(Boolean);
          return {
            reportName,
            counts: { patients: patients.length, doctors: doctors.length },
          };
        },
      },
      userRepository,
    }),
    undefined,
    (result) => ({
      reportId: `rep-${Date.now()}`,
      reportName: result.reportName,
      ...(result.data ?? {}),
      generatedAt: new Date().toISOString(),
    })
  );

  const auditMedicalRecordsUseCase = new AuditMedicalRecordsUseCase({
    medicalRecordRepository,
    auditLogRepository,
    userRepository,
  });

  const browsePublicInfoUseCase = new BrowsePublicInfoUseCase({
    serviceCatalogRepository,
    settingsRepository,
  });

  const guestSearchDoctorsUseCase = adaptUseCase(
    new GuestSearchDoctorsUseCase({ doctorRepository }),
    (input) => ({
      name: input?.name ?? input?.query,
      specialization: input?.specialization ?? input?.specialty,
    }),
    (result) => ({
      page: 1,
      pageSize: result.doctors?.length ?? 0,
      total: result.doctors?.length ?? 0,
      doctors: result.doctors ?? [],
    })
  );

  const startRegistrationUseCase = adaptUseCase(
    new StartRegistrationUseCase({ patientRepository }),
    (input) => ({
      fullName: input?.fullName ?? input?.name,
      email: input?.email,
      phone: input?.phone,
    })
  );

  const submitContactFormUseCase = new SubmitContactFormUseCase({
    contactLeadRepository,
  });

  const viewAvailableSlotsUseCase = new ViewAvailableSlotsUseCase({
    doctorRepository,
    appointmentRepository,
  });

  return {
    ...authUseCases,
    ...patientUseCases,
    ...doctorUseCases,
    ...adminUseCases,
    ...guestUseCases,

    // Legacy-compatible exports still used by existing controllers.
    assignRolesUseCase,
    manageUserStatusUseCase,
    setDoctorSlotsUseCase: manageDoctorSchedulesUseCase,
    manageDoctorSchedulesUseCase,
    overrideAppointmentUseCase,
    manageBillingUseCase,
    configureServicesAndPricingUseCase,
    manageSystemSettingsUseCase,
    runReportUseCase,
    auditMedicalRecordsUseCase,

    browsePublicInfoUseCase,
    guestSearchDoctorsUseCase,
    startRegistrationUseCase,
    submitContactFormUseCase,
    viewAvailableSlotsUseCase,

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
