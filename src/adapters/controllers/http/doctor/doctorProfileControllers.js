import { createHandler } from '../createHandler.js';
import { UpdateDoctorProfileViewModel } from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorProfileControllers({ updateDoctorProfileAndAvailabilityUseCase }) {
  return {
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
