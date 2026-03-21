import { createHandler } from '../createHandler.js';
import { RegisterPatientAccountViewModel, UpdatePatientProfileViewModel } from '../../../viewmodels/patientViewModels.js';

export function buildPatientProfileControllers({ registerPatientAccountUseCase, updatePatientProfileUseCase }) {
  return {
    registerPatientAccount: createHandler({
      useCase: registerPatientAccountUseCase,
      mapInput: (req) => req.body ?? {},
      mapOutput: (result) => new RegisterPatientAccountViewModel(result),
      successStatus: 201,
    }),
    updatePatientProfile: createHandler({
      useCase: updatePatientProfileUseCase,
      mapInput: (req) => ({ patientId: req.user?.id ?? req.body?.patientId, ...req.body }),
      mapOutput: (result) => new UpdatePatientProfileViewModel(result),
    }),
  };
}
