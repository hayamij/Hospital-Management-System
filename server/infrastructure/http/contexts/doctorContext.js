import { DoctorLoginUseCase } from '../../../application/use-cases/doctor/doctorLogin.usecase.js';
import { ViewDoctorScheduleUseCase } from '../../../application/use-cases/doctor/viewDoctorSchedule.usecase.js';
import { ManageAppointmentDecisionUseCase } from '../../../application/use-cases/doctor/manageAppointmentDecision.usecase.js';
import { MarkAppointmentStatusUseCase } from '../../../application/use-cases/doctor/markAppointmentStatus.usecase.js';
import { AccessPatientChartUseCase } from '../../../application/use-cases/doctor/accessPatientChart.usecase.js';
import { AddVisitNoteUseCase } from '../../../application/use-cases/doctor/addVisitNote.usecase.js';
import { UpdateMedicalRecordEntryUseCase } from '../../../application/use-cases/doctor/updateMedicalRecordEntry.usecase.js';
import { ReviewTestResultsUseCase } from '../../../application/use-cases/doctor/reviewTestResults.usecase.js';
import { UpdateDoctorProfileAndAvailabilityUseCase } from '../../../application/use-cases/doctor/updateDoctorProfileAndAvailability.usecase.js';
import { SendDoctorMessageUseCase } from '../../../application/use-cases/doctor/sendDoctorMessage.usecase.js';
import { adaptUseCase, noopNotification } from './common.js';

export const createDoctorUseCases = ({
  userRepository,
  doctorRepository,
  patientRepository,
  appointmentRepository,
  medicalRecordRepository,
  messageRepository,
  labResultRepository,
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
  });
  const accessPatientChartClass = new AccessPatientChartUseCase({
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
  const sendDoctorMessageClass = new SendDoctorMessageUseCase({
    doctorRepository,
    patientRepository,
    messageRepository,
    notificationService: noopNotification,
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
      page: 1,
      pageSize: result.appointments?.length ?? 0,
      total: result.appointments?.length ?? 0,
      appointments: result.appointments ?? [],
    })
  );
  const accessPatientChartUseCase = adaptUseCase(
    accessPatientChartClass,
    undefined,
    (result) => ({
      page: 1,
      pageSize: result.entries?.length ?? 0,
      total: result.entries?.length ?? 0,
      records: result.entries ?? [],
    })
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
    addVisitNoteUseCase,
    updateMedicalRecordEntryUseCase,
    reviewTestResultsUseCase: reviewTestResultsClass,
    updateDoctorProfileUseCase: updateDoctorProfileAndAvailabilityClass,
    updateDoctorProfileAndAvailabilityUseCase: updateDoctorProfileAndAvailabilityClass,
    sendDoctorMessageUseCase,
  };
};
