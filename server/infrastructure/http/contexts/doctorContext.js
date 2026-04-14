import { DoctorLoginUseCase } from '../../../application/use-cases/doctor/doctorLogin.usecase.js';
import { ViewDoctorScheduleUseCase } from '../../../application/use-cases/doctor/viewDoctorSchedule.usecase.js';
import { ManageAppointmentDecisionUseCase } from '../../../application/use-cases/doctor/manageAppointmentDecision.usecase.js';
import { MarkAppointmentStatusUseCase } from '../../../application/use-cases/doctor/markAppointmentStatus.usecase.js';
import { AccessPatientChartUseCase } from '../../../application/use-cases/doctor/accessPatientChart.usecase.js';
import { CreateMedicalRecordUseCase } from '../../../application/use-cases/doctor/createMedicalRecord.usecase.js';
import { AddVisitNoteUseCase } from '../../../application/use-cases/doctor/addVisitNote.usecase.js';
import { UpdateMedicalRecordEntryUseCase } from '../../../application/use-cases/doctor/updateMedicalRecordEntry.usecase.js';
import { ReviewTestResultsUseCase } from '../../../application/use-cases/doctor/reviewTestResults.usecase.js';
import { UpdateDoctorProfileAndAvailabilityUseCase } from '../../../application/use-cases/doctor/updateDoctorProfileAndAvailability.usecase.js';
import { ViewDoctorProfileUseCase } from '../../../application/use-cases/doctor/viewDoctorProfile.usecase.js';
import { SendDoctorMessageUseCase } from '../../../application/use-cases/doctor/sendDoctorMessage.usecase.js';
import { ViewDoctorMessagesUseCase } from '../../../application/use-cases/doctor/viewDoctorMessages.usecase.js';
import { ViewPendingPaymentsUseCase } from '../../../application/use-cases/doctor/viewPendingPayments.usecase.js';
import { ReviewTransferPaymentUseCase } from '../../../application/use-cases/doctor/reviewTransferPayment.usecase.js';
import { ViewDoctorBillingUseCase } from '../../../application/use-cases/doctor/viewDoctorBilling.usecase.js';
import { adaptUseCase, noopNotification } from './common.js';

export const createDoctorUseCases = ({
  userRepository,
  doctorRepository,
  patientRepository,
  appointmentRepository,
  billingRepository,
  serviceCatalogRepository,
  medicalRecordRepository,
  messageRepository,
  labResultRepository,
  paymentRepository,
  authService,
}) => {
  const doctorLoginClass = new DoctorLoginUseCase({ userRepository, authService });
  const viewDoctorScheduleClass = new ViewDoctorScheduleUseCase({
    doctorRepository,
    appointmentRepository,
  });
  const manageAppointmentDecisionClass = new ManageAppointmentDecisionUseCase({
    doctorRepository,
    appointmentRepository,
  });
  const markAppointmentStatusClass = new MarkAppointmentStatusUseCase({
    doctorRepository,
    appointmentRepository,
    billingRepository,
    serviceCatalogRepository,
  });
  const accessPatientChartClass = new AccessPatientChartUseCase({
    doctorRepository,
    patientRepository,
    medicalRecordRepository,
  });
  const createMedicalRecordClass = new CreateMedicalRecordUseCase({
    doctorRepository,
    patientRepository,
    medicalRecordRepository,
  });
  const addVisitNoteClass = new AddVisitNoteUseCase({
    doctorRepository,
    patientRepository,
    medicalRecordRepository,
  });
  const updateMedicalRecordEntryClass = new UpdateMedicalRecordEntryUseCase({
    doctorRepository,
    medicalRecordRepository,
  });
  const reviewTestResultsClass = new ReviewTestResultsUseCase({
    doctorRepository,
    labResultRepository,
  });
  const updateDoctorProfileAndAvailabilityClass =
    new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository });
  const viewDoctorProfileClass = new ViewDoctorProfileUseCase({ doctorRepository });
  const sendDoctorMessageClass = new SendDoctorMessageUseCase({
    doctorRepository,
    patientRepository,
    messageRepository,
    notificationService: noopNotification,
  });
  const viewDoctorMessagesClass = new ViewDoctorMessagesUseCase({
    doctorRepository,
    patientRepository,
    messageRepository,
  });
  const viewPendingPaymentsClass = new ViewPendingPaymentsUseCase({
    doctorRepository,
    paymentRepository,
  });
  const reviewTransferPaymentClass = new ReviewTransferPaymentUseCase({
    doctorRepository,
    patientRepository,
    billingRepository,
    paymentRepository,
  });
  const viewDoctorBillingClass = new ViewDoctorBillingUseCase({
    doctorRepository,
    billingRepository,
  });

  const doctorLoginUseCase = adaptUseCase(
    doctorLoginClass,
    undefined,
    (result) => ({ ...result, token: result.accessToken })
  );
  const viewDoctorScheduleUseCase = adaptUseCase(
    viewDoctorScheduleClass,
    undefined,
    (result) => ({
      page: result?.page ?? 1,
      pageSize: result?.pageSize ?? (result?.appointments?.length ?? 0),
      total: result?.total ?? (result?.appointments?.length ?? 0),
      appointments: result.appointments ?? [],
    })
  );
  const accessPatientChartUseCase = adaptUseCase(
    accessPatientChartClass,
    undefined,
    (result) => {
      const records = result?.entries ?? [];
      return {
        page: 1,
        pageSize: records.length,
        total: records.length,
        records,
        patientId: result?.patientId ?? null,
        recordId: result?.recordId ?? null,
        recordCreatedAt: result?.recordCreatedAt ?? null,
        hasRecord: Boolean(result?.hasRecord || result?.recordId),
      };
    }
  );
  const addVisitNoteUseCase = adaptUseCase(
    addVisitNoteClass,
    undefined,
    (result) => ({
      recordId: result.patientId,
      entryId: `entry-${result.entryCount ?? 0}`,
      addedAt: new Date().toISOString(),
    })
  );
  const updateMedicalRecordEntryUseCase = adaptUseCase(
    updateMedicalRecordEntryClass,
    undefined,
    (result) => ({
      recordId: result.recordId,
      entryId: `entry-${result.entryCount ?? 0}`,
      addedAt: new Date().toISOString(),
    })
  );
  const sendDoctorMessageUseCase = adaptUseCase(
    sendDoctorMessageClass,
    undefined,
    (result) => ({
      messageId: result.messageId,
      status: 'sent',
      sentAt: new Date().toISOString(),
    })
  );

  return {
    doctorLoginUseCase,
    viewDoctorScheduleUseCase,
    manageAppointmentDecisionUseCase: manageAppointmentDecisionClass,
    markAppointmentStatusUseCase: markAppointmentStatusClass,
    accessPatientChartUseCase,
    createMedicalRecordUseCase: createMedicalRecordClass,
    addVisitNoteUseCase,
    updateMedicalRecordEntryUseCase,
    reviewTestResultsUseCase: reviewTestResultsClass,
    viewDoctorProfileUseCase: viewDoctorProfileClass,
    updateDoctorProfileUseCase: updateDoctorProfileAndAvailabilityClass,
    updateDoctorProfileAndAvailabilityUseCase: updateDoctorProfileAndAvailabilityClass,
    sendDoctorMessageUseCase,
    viewDoctorMessagesUseCase: viewDoctorMessagesClass,
    viewPendingPaymentsUseCase: viewPendingPaymentsClass,
    reviewTransferPaymentUseCase: reviewTransferPaymentClass,
    viewDoctorBillingUseCase: viewDoctorBillingClass,
  };
};
