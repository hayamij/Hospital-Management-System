import { createHandler } from '../createHandler.js';
import { UpdateDoctorProfileViewModel, ViewDoctorProfileViewModel } from '../../../viewmodels/doctorViewModels.js';

const resolveDoctorId = (req, fallback) =>
  req.user?.doctorId ?? req.user?.id ?? fallback;

export function buildDoctorProfileControllers({ viewDoctorProfileUseCase, updateDoctorProfileAndAvailabilityUseCase }) {
  return {
    viewProfile: createHandler({
      useCase: viewDoctorProfileUseCase,
      mapInput: (req) => ({
        doctorId: resolveDoctorId(req, req.query?.doctorId),
      }),
      mapOutput: (result) => new ViewDoctorProfileViewModel(result),
    }),
    updateProfile: createHandler({
      useCase: updateDoctorProfileAndAvailabilityUseCase,
      mapInput: (req) => ({
        doctorId: resolveDoctorId(req, req.body?.doctorId),
        profile: req.body?.profile ?? {},
        slotsPerDay: req.body?.slotsPerDay,
      }),
      mapOutput: (result) => new UpdateDoctorProfileViewModel(result),
    }),
  };
}
