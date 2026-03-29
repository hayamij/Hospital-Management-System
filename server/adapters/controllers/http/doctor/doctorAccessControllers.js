import { createHandler } from '../createHandler.js';
import { DoctorLoginViewModel } from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorAccessControllers({ doctorLoginUseCase }) {
  return {
    doctorLogin: createHandler({
      useCase: doctorLoginUseCase,
      mapInput: (req) => ({ email: req.body?.email, password: req.body?.password }),
      mapOutput: (result) => new DoctorLoginViewModel(result),
    }),
  };
}
