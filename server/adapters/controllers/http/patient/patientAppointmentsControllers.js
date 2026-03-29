import { createHandler } from '../createHandler.js';
import {
  ScheduleAppointmentViewModel,
  RescheduleAppointmentViewModel,
  CancelAppointmentViewModel,
  ViewAppointmentsViewModel,
} from '../../../viewmodels/patientViewModels.js';

const resolvePatientId = (req, fallback) =>
  req.user?.patientId ?? req.user?.id ?? fallback;

export function buildPatientAppointmentsControllers({ scheduleAppointmentUseCase, rescheduleAppointmentUseCase, cancelAppointmentUseCase, viewAppointmentsUseCase }) {
  return {
    scheduleAppointment: createHandler({
      useCase: scheduleAppointmentUseCase,
      mapInput: (req) => ({ ...req.body, patientId: resolvePatientId(req, req.body?.patientId) }),
      mapOutput: (result) => new ScheduleAppointmentViewModel(result),
      successStatus: 201,
    }),
    rescheduleAppointment: createHandler({
      useCase: rescheduleAppointmentUseCase,
      mapInput: (req) => ({ ...req.body, patientId: resolvePatientId(req, req.body?.patientId) }),
      mapOutput: (result) => new RescheduleAppointmentViewModel(result),
    }),
    cancelAppointment: createHandler({
      useCase: cancelAppointmentUseCase,
      mapInput: (req) => ({ appointmentId: req.params?.id, patientId: resolvePatientId(req, req.body?.patientId) }),
      mapOutput: (result) => new CancelAppointmentViewModel(result),
    }),
    viewAppointments: createHandler({
      useCase: viewAppointmentsUseCase,
      mapInput: (req) => ({ patientId: resolvePatientId(req, req.query?.patientId), status: req.query?.status, page: req.query?.page, pageSize: req.query?.pageSize }),
      mapOutput: (result) => new ViewAppointmentsViewModel(result),
    }),
  };
}
