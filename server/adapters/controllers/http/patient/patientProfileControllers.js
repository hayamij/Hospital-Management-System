import { createHandler } from '../createHandler.js';
import {
  RegisterPatientAccountViewModel,
  UpdatePatientProfileViewModel,
  ViewPatientProfileViewModel,
} from '../../../viewmodels/patientViewModels.js';

const resolvePatientId = (req, fallback) =>
  req.user?.patientId ?? fallback ?? req.user?.id;

export function buildPatientProfileControllers({ registerPatientAccountUseCase, updatePatientProfileUseCase, viewPatientProfileUseCase }) {
  return {
    registerPatientAccount: createHandler({
      useCase: registerPatientAccountUseCase,
      mapInput: (req) => req.body ?? {},
      mapOutput: (result) => new RegisterPatientAccountViewModel(result),
      successStatus: 201,
    }),
    viewPatientProfile: createHandler({
      useCase: viewPatientProfileUseCase,
      mapInput: (req) => ({ patientId: resolvePatientId(req, req.query?.patientId) }),
      mapOutput: (result) => new ViewPatientProfileViewModel(result),
    }),
    updatePatientProfile: createHandler({
      useCase: updatePatientProfileUseCase,
      mapInput: (req) => ({ patientId: resolvePatientId(req, req.body?.patientId), ...req.body }),
      mapOutput: (result) => new UpdatePatientProfileViewModel(result),
    }),
  };
}
