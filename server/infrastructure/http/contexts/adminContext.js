import { AdminLoginUseCase } from '../../../application/use-cases/admin/adminLogin.usecase.js';
import { ManageDoctorSchedulesUseCase } from '../../../application/use-cases/admin/manageDoctorSchedules.usecase.js';
import { OverrideAppointmentUseCase } from '../../../application/use-cases/admin/overrideAppointment.usecase.js';
import { ConfigureServicesAndPricingUseCase } from '../../../application/use-cases/admin/configureServicesAndPricing.usecase.js';
import { ManageSystemSettingsUseCase } from '../../../application/use-cases/admin/manageSystemSettings.usecase.js';
import { RunReportsUseCase } from '../../../application/use-cases/admin/runReports.usecase.js';
import { ManageBillingUseCase } from '../../../application/use-cases/admin/manageBilling.usecase.js';
import { AuditMedicalRecordsUseCase } from '../../../application/use-cases/admin/auditMedicalRecords.usecase.js';
import { ListUsersUseCase } from '../../../application/use-cases/admin/listUsers.usecase.js';
import { CreateUserUseCase } from '../../../application/use-cases/admin/createUser.usecase.js';
import { UpdateUserUseCase } from '../../../application/use-cases/admin/updateUser.usecase.js';
import { adaptUseCase, noopNotification, normalizeIdentifier } from './common.js';

const mapCreateDoctorInput = (input = {}) => {
  const normalized = {
    ...input,
    doctorId: normalizeIdentifier(input.doctorId),
    id: normalizeIdentifier(input.id),
    firstName: input.firstName ?? input.givenName,
    lastName: input.lastName ?? input.familyName,
    specialty: input.specialty ?? input.specialization,
    phone: input.phone ?? input.phoneNumber,
    active:
      typeof input.active === 'boolean'
        ? input.active
        : typeof input.isActive === 'boolean'
        ? input.isActive
        : undefined,
    workingDays:
      input.workingDays ??
      input.availability?.workingDays ??
      input.schedule?.workingDays,
    startTime:
      input.startTime ??
      input.availability?.startTime ??
      input.schedule?.startTime,
    endTime:
      input.endTime ?? input.availability?.endTime ?? input.schedule?.endTime,
  };

  return normalized;
};

const mapUpdateDoctorInput = (input = {}) => {
  const normalized = mapCreateDoctorInput(input);

  return {
    ...normalized,
    doctorId:
      normalizeIdentifier(input.doctorId) ??
      normalizeIdentifier(input.id) ??
      normalizeIdentifier(input.userId),
  };
};

export const createAdminUseCases = ({
  userRepository,
  doctorRepository,
  appointmentRepository,
  billingRepository,
  medicalRecordRepository,
  serviceCatalogRepository,
  settingsRepository,
  reportRepository,
  auditLogRepository,
  authService,
}) => {
  const adminLoginClass = new AdminLoginUseCase({ userRepository, authService });
  const manageDoctorSchedulesClass = new ManageDoctorSchedulesUseCase({
    doctorRepository,
    userRepository,
  });
  const overrideAppointmentClass = new OverrideAppointmentUseCase({
    userRepository,
    doctorRepository,
    appointmentRepository,
  });
  const configureServicesAndPricingClass = new ConfigureServicesAndPricingUseCase({
    serviceCatalogRepository,
    userRepository,
  });
  const manageSystemSettingsClass = new ManageSystemSettingsUseCase({
    settingsRepository:
      settingsRepository || {
        async getSettings() {
          return {};
        },
        async save(settings) {
          return {
            settings,
            updatedAt: new Date().toISOString(),
            version: 'v1',
          };
        },
      },
    userRepository,
  });
  const runReportsClass = new RunReportsUseCase({
    reportRepository,
    userRepository,
  });
  const manageBillingClass = new ManageBillingUseCase({
    billingRepository,
    userRepository,
  });
  const auditMedicalRecordsClass =
    medicalRecordRepository && auditLogRepository
      ? new AuditMedicalRecordsUseCase({
          medicalRecordRepository,
          auditLogRepository,
          userRepository,
        })
      : null;
  const listUsersClass = new ListUsersUseCase({ userRepository });
  const createUserClass = new CreateUserUseCase({ userRepository, authService });
  const updateUserClass = new UpdateUserUseCase({ userRepository });

  const adminLoginUseCase = adaptUseCase(
    adminLoginClass,
    undefined,
    (result) => ({ ...result, token: result.accessToken })
  );
  const manageDoctorProfileUseCase = adaptUseCase(
    manageDoctorSchedulesClass,
    (input) => {
      const payload = mapUpdateDoctorInput(input);
      return {
        adminId: normalizeIdentifier(input?.adminId) ?? normalizeIdentifier(input?.updatedBy),
        doctorId: payload.doctorId,
        slotsPerDay:
          input?.slotsPerDay ??
          input?.availableSlotsPerDay ??
          input?.availability?.slotsPerDay ??
          0,
      };
    },
    (result) => ({
      doctorId: result.doctorId,
      status: 'saved',
      action: result.action,
      updatedAt: new Date().toISOString(),
    })
  );
  const runOperationalReportUseCase = adaptUseCase(
    runReportsClass,
    (input) => ({
      adminId: input?.adminId ?? input?.generatedBy,
      reportName: input?.reportType ?? input?.reportName,
      params: {
        startDate: input?.startDate,
        endDate: input?.endDate,
        format: input?.format,
        includeDetails: input?.includeDetails,
        filters: input?.filters,
        metadata: input?.metadata,
      },
    }),
    (result) => ({
      reportId: `rep-${Date.now()}`,
      reportType: result.reportName,
      generatedAt: new Date().toISOString(),
      data: result.data,
      rows: result.data,
    })
  );
  const processBackofficeBillingUseCase = adaptUseCase(
    manageBillingClass,
    (input) => ({
      invoiceId: input?.billingId,
      adminId: input?.adminId ?? input?.processedBy,
      action:
        String(input?.action || '').toLowerCase() === 'paid'
          ? 'markPaid'
          : String(input?.action || '').toLowerCase() === 'void'
          ? 'void'
          : 'issue',
      dueDate: input?.dueDate ?? input?.processedAt,
    })
  );

  const reviewAuditLogUseCase =
    auditMedicalRecordsClass ||
    adaptUseCase(
      {
        async execute() {
          return { records: [] };
        },
      },
      undefined,
      (result) => result
    );

  return {
    adminLoginUseCase,
    manageDoctorProfileUseCase,
    manageScheduleTemplateUseCase: manageDoctorSchedulesClass,
    publishScheduleUseCase: manageDoctorSchedulesClass,
    overrideDoctorScheduleUseCase: overrideAppointmentClass,
    manageServiceCatalogUseCase: configureServicesAndPricingClass,
    configureSystemSettingsUseCase: manageSystemSettingsClass,
    runOperationalReportUseCase,
    processBackofficeBillingUseCase,
    reviewAuditLogUseCase,
    manageDoctorSchedulesUseCase: manageDoctorSchedulesClass,
    overrideAppointmentUseCase: overrideAppointmentClass,
    configureServicesAndPricingUseCase: configureServicesAndPricingClass,
    manageSystemSettingsUseCase: manageSystemSettingsClass,
    runReportUseCase: runOperationalReportUseCase,
    manageBillingUseCase: processBackofficeBillingUseCase,
    auditMedicalRecordsUseCase: reviewAuditLogUseCase,
    listUsersUseCase: listUsersClass,
    createUserUseCase: createUserClass,
    updateUserUseCase: updateUserClass,
  };
};
