import { createHandler } from '../createHandler.js';
import { ViewDoctorAppointmentsViewModel, UpdateAppointmentStatusViewModel } from '../../../viewmodels/doctorViewModels.js';

const resolveDoctorId = (req, fallback) =>
  req.user?.doctorId ?? req.user?.id ?? fallback;

export function buildDoctorScheduleControllers({ viewDoctorScheduleUseCase, manageAppointmentDecisionUseCase, markAppointmentStatusUseCase }) {
  return {
    viewSchedule: createHandler({
      useCase: viewDoctorScheduleUseCase,
      mapInput: (req) => ({
        doctorId: resolveDoctorId(req, req.query?.doctorId),
        from: req.query?.from,
        to: req.query?.to,
        status: req.query?.status,
        page: req.query?.page,
        pageSize: req.query?.pageSize,
      }),
      mapOutput: (result) => new ViewDoctorAppointmentsViewModel(result),
    }),
    decideAppointment: createHandler({
      useCase: manageAppointmentDecisionUseCase,
      mapInput: (req) => ({
        doctorId: resolveDoctorId(req, req.body?.doctorId),
        appointmentId: req.params?.appointmentId,
        decision: req.body?.decision,
      }),
      mapOutput: (result) => new UpdateAppointmentStatusViewModel(result),
    }),
    markAppointmentStatus: createHandler({
      useCase: markAppointmentStatusUseCase,
      mapInput: (req) => ({
        doctorId: resolveDoctorId(req, req.body?.doctorId),
        appointmentId: req.params?.appointmentId,
        status: req.body?.status,
      }),
      mapOutput: (result) => new UpdateAppointmentStatusViewModel(result),
    }),
  };
}
