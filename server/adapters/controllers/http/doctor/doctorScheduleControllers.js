import { createHandler } from '../createHandler.js';
import { ViewDoctorAppointmentsViewModel, UpdateAppointmentStatusViewModel } from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorScheduleControllers({ viewDoctorScheduleUseCase, manageAppointmentDecisionUseCase, markAppointmentStatusUseCase }) {
  return {
    viewSchedule: createHandler({
      useCase: viewDoctorScheduleUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.query?.doctorId,
        from: req.query?.from,
        to: req.query?.to,
      }),
      mapOutput: (result) => new ViewDoctorAppointmentsViewModel(result),
    }),
    decideAppointment: createHandler({
      useCase: manageAppointmentDecisionUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        appointmentId: req.params?.appointmentId,
        decision: req.body?.decision,
      }),
      mapOutput: (result) => new UpdateAppointmentStatusViewModel(result),
    }),
    markAppointmentStatus: createHandler({
      useCase: markAppointmentStatusUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        appointmentId: req.params?.appointmentId,
        status: req.body?.status,
      }),
      mapOutput: (result) => new UpdateAppointmentStatusViewModel(result),
    }),
  };
}
