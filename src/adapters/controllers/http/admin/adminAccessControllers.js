import { createHandler } from '../createHandler.js';
import { LoginViewModel } from '../../../viewmodels/authViewModels.js';

// Admin access: login
export function buildAdminAccessControllers({ adminLoginUseCase }) {
  return {
    adminLogin: createHandler({
      useCase: adminLoginUseCase,
      mapInput: (req) => ({ email: req.body?.email, password: req.body?.password }),
      mapOutput: (result) => new LoginViewModel(result),
    }),
  };
}
