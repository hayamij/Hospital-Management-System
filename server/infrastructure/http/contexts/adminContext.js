import { AdminLoginUseCase } from '../../../application/use-cases/admin/adminLogin.usecase.js';
import { ManageDoctorProfileUseCase } from '../../../application/use-cases/admin/manageDoctorProfile.usecase.js';
import { ManageScheduleTemplateUseCase } from '../../../application/use-cases/admin/manageScheduleTemplate.usecase.js';
import { PublishScheduleUseCase } from '../../../application/use-cases/admin/publishSchedule.usecase.js';
import { OverrideDoctorScheduleUseCase } from '../../../application/use-cases/admin/overrideDoctorSchedule.usecase.js';
import { ManageServiceCatalogUseCase } from '../../../application/use-cases/admin/manageServiceCatalog.usecase.js';
import { ConfigureSystemSettingsUseCase } from '../../../application/use-cases/admin/configureSystemSettings.usecase.js';
import { RunOperationalReportUseCase } from '../../../application/use-cases/admin/runOperationalReport.usecase.js';
import { ProcessBackofficeBillingUseCase } from '../../../application/use-cases/admin/processBackofficeBilling.usecase.js';
import { ReviewAuditLogUseCase } from '../../../application/use-cases/admin/reviewAuditLog.usecase.js';
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
  serviceCatalogRepository,
  reportRepository,
  auditLogRepository,
  authService,
}) => {
  const adminLoginClass = new AdminLoginUseCase({ userRepository, authService });
  const manageDoctorProfileClass = new ManageDoctorProfileUseCase({
    doctorRepository,
    notificationService: noopNotification,
  });
  const manageScheduleTemplateClass = new ManageScheduleTemplateUseCase({
    doctorRepository,
    appointmentRepository,
  });
  const publishScheduleClass = new PublishScheduleUseCase({
    doctorRepository,
    appointmentRepository,
  });
  const overrideDoctorScheduleClass = new OverrideDoctorScheduleUseCase({
    doctorRepository,
    appointmentRepository,
  });
  const manageServiceCatalogClass = new ManageServiceCatalogUseCase({
    serviceCatalogRepository,
  });
  const configureSystemSettingsClass = new ConfigureSystemSettingsUseCase({
    settingsRepository: {
      async saveSettings(settings) {
        return {
          settings,
          updatedAt: new Date().toISOString(),
          version: 'v1',
        };
      },
    },
  });
  const runOperationalReportClass = new RunOperationalReportUseCase({
    reportRepository,
  });
  const processBackofficeBillingClass = new ProcessBackofficeBillingUseCase({
    billingRepository,
  });
  const reviewAuditLogClass = new ReviewAuditLogUseCase({ auditLogRepository });
  const listUsersClass = new ListUsersUseCase({ userRepository });
  const createUserClass = new CreateUserUseCase({ userRepository, authService });
  const updateUserClass = new UpdateUserUseCase({ userRepository });

  const adminLoginUseCase = adaptUseCase(
    adminLoginClass,
    undefined,
    (result) => ({ ...result, token: result.accessToken })
  );
  const manageDoctorProfileUseCase = adaptUseCase(
    manageDoctorProfileClass,
    (input) => {
      const action = input?.action ?? 'update';
      const payload =
        action === 'create'
          ? mapCreateDoctorInput(input)
          : mapUpdateDoctorInput(input);

      return {
        ...payload,
        action,
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
    runOperationalReportClass,
    (input) => ({
      reportType: input?.reportType,
      startDate: input?.startDate,
      endDate: input?.endDate,
      format: input?.format,
      generatedBy: input?.generatedBy,
      includeDetails: input?.includeDetails,
      filters: input?.filters,
      metadata: input?.metadata,
    }),
    (result) => ({
      reportId: result.reportId,
      reportType: result.reportType,
      generatedAt: result.generatedAt,
      fileUrl: result.exportUrl,
      format: result.format,
      summary: result.summary,
      generatedBy: result.generatedBy,
      metadata: result.metadata,
      data: result.rows,
      rows: result.rows,
      totals: result.totals,
    })
  );
  const processBackofficeBillingUseCase = adaptUseCase(
    processBackofficeBillingClass,
    (input) => ({
      invoiceId: input?.billingId,
      action: input?.action,
      amount: input?.amount,
      adjustedBy: input?.processedBy,
      note: input?.note,
      reason: input?.reason,
      metadata: input?.metadata,
      adjustedAt: input?.processedAt,
    })
  );

  return {
    adminLoginUseCase,
    manageDoctorProfileUseCase,
    manageScheduleTemplateUseCase: manageScheduleTemplateClass,
    publishScheduleUseCase: publishScheduleClass,
    overrideDoctorScheduleUseCase: overrideDoctorScheduleClass,
    manageServiceCatalogUseCase: manageServiceCatalogClass,
    configureSystemSettingsUseCase: configureSystemSettingsClass,
    runOperationalReportUseCase,
    processBackofficeBillingUseCase,
    reviewAuditLogUseCase: reviewAuditLogClass,
    listUsersUseCase: listUsersClass,
    createUserUseCase: createUserClass,
    updateUserUseCase: updateUserClass,
  };
};
