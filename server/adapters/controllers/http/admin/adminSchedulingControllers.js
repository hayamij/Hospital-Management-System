import { createHandler } from '../createHandler.js';
import { UpdateAppointmentStatusViewModel } from '../../../viewmodels/doctorViewModels.js';

// Admin handles doctor schedules and appointment overrides
export function buildAdminSchedulingControllers({ manageDoctorSchedulesUseCase, overrideAppointmentUseCase }) {
  return {
    setDoctorSlots: createHandler({
      useCase: manageDoctorSchedulesUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        doctorId: req.params?.doctorId,
        slotsPerDay: req.body?.slotsPerDay,
      }),
    }),
    overrideAppointment: createHandler({
      useCase: overrideAppointmentUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        appointmentId: req.params?.appointmentId,
        action: req.body?.action,
        startAt: req.body?.startAt,
        endAt: req.body?.endAt,
        doctorId: req.body?.doctorId,
      }),
      mapOutput: (result) => new UpdateAppointmentStatusViewModel(result),
    }),
  };
}
