import { DownloadInvoiceUseCase } from '../../../application/use-cases/patient/downloadInvoice.usecase.js';
import { ScheduleAppointmentUseCase } from '../../../application/use-cases/patient/scheduleAppointment.usecase.js';
import { RescheduleAppointmentUseCase } from '../../../application/use-cases/patient/rescheduleAppointment.usecase.js';
import { CancelAppointmentUseCase } from '../../../application/use-cases/patient/cancelAppointment.usecase.js';
import { ViewAppointmentsUseCase } from '../../../application/use-cases/patient/viewAppointments.usecase.js';
import { ViewBillingAndPaymentsUseCase } from '../../../application/use-cases/patient/viewBillingAndPayments.usecase.js';
import { ViewMedicalRecordsUseCase } from '../../../application/use-cases/patient/viewMedicalRecords.usecase.js';
import { DownloadPrescriptionUseCase } from '../../../application/use-cases/patient/downloadPrescription.usecase.js';
import { SendPatientMessageUseCase } from '../../../application/use-cases/patient/sendPatientMessage.usecase.js';
import { RegisterPatientAccountUseCase } from '../../../application/use-cases/patient/registerPatientAccount.usecase.js';
import { UpdatePatientProfileUseCase } from '../../../application/use-cases/patient/updatePatientProfile.usecase.js';
import { SearchDoctorsUseCase } from '../../../application/use-cases/patient/searchDoctors.usecase.js';
import { adaptUseCase, noopNotification } from './common.js';

export const createPatientUseCases = ({
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
}) => {
  const scheduleAppointmentClass = new ScheduleAppointmentUseCase({
    patientRepository,
    doctorRepository,
    appointmentRepository,
    notificationService: noopNotification,
  });
  const rescheduleAppointmentClass = new RescheduleAppointmentUseCase({
    patientRepository,
    appointmentRepository,
    notificationService: noopNotification,
  });
  const cancelAppointmentClass = new CancelAppointmentUseCase({
    patientRepository,
    appointmentRepository,
    notificationService: noopNotification,
  });
  const viewAppointmentsClass = new ViewAppointmentsUseCase({
    patientRepository,
    appointmentRepository,
  });
  const viewBillingAndPaymentsClass = new ViewBillingAndPaymentsUseCase({
    patientRepository,
    billingRepository,
    paymentRepository,
  });
  const downloadInvoiceUseCase = new DownloadInvoiceUseCase({
    patientRepository,
    billingRepository,
  });
  const viewMedicalRecordsClass = new ViewMedicalRecordsUseCase({
    patientRepository,
    medicalRecordRepository,
  });
  const downloadPrescriptionClass = new DownloadPrescriptionUseCase({
    patientRepository,
    prescriptionRepository,
  });
  const sendPatientMessageClass = new SendPatientMessageUseCase({
    patientRepository,
    doctorRepository,
    messageRepository,
    notificationService: noopNotification,
  });
  const registerPatientAccountClass = new RegisterPatientAccountUseCase({
    userRepository,
    patientRepository,
    authService,
  });
  const updatePatientProfileClass = new UpdatePatientProfileUseCase({
    patientRepository,
  });
  const searchDoctorsClass = new SearchDoctorsUseCase({ doctorRepository });

  const searchDoctorsUseCase = adaptUseCase(
    searchDoctorsClass,
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

  return {
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
    searchDoctorsUseCase,
  };
};
