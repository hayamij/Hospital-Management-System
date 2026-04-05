import { createHandler } from '../createHandler.js';
import { UpdateDoctorProfileViewModel, ViewDoctorProfileViewModel } from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorProfileControllers({ viewDoctorProfileUseCase, updateDoctorProfileAndAvailabilityUseCase }) {
  return {
    viewProfile: createHandler({
      useCase: viewDoctorProfileUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.query?.doctorId,
      }),
      mapOutput: (result) => new ViewDoctorProfileViewModel(result),
    }),
    updateProfile: createHandler({
      useCase: updateDoctorProfileAndAvailabilityUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        profile: req.body?.profile ?? {},
        slotsPerDay: req.body?.slotsPerDay,
      }),
      mapOutput: (result) => new UpdateDoctorProfileViewModel(result),
    }),
  };
}
