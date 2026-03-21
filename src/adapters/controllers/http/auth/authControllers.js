import { createHandler } from '../createHandler.js';
import { LoginViewModel, LogoutViewModel, ResetPasswordViewModel } from '../../../viewmodels/authViewModels.js';

export function buildAuthControllers({ loginUseCase, logoutUseCase, resetPasswordUseCase }) {
  return {
    login: createHandler({
      useCase: loginUseCase,
      mapInput: (req) => ({ email: req.body?.email, password: req.body?.password }),
      mapOutput: (result) => new LoginViewModel(result),
    }),
    logout: createHandler({
      useCase: logoutUseCase,
      mapInput: (req) => ({
        userId: req.user?.id ?? req.body?.userId,
        refreshToken: req.body?.refreshToken,
        accessToken: req.body?.accessToken,
      }),
      mapOutput: (result) => new LogoutViewModel(result),
    }),
    resetPassword: createHandler({
      useCase: resetPasswordUseCase,
      mapInput: (req) => ({
        email: req.body?.email,
        oldPassword: req.body?.oldPassword,
        newPassword: req.body?.newPassword,
      }),
      mapOutput: (result) => new ResetPasswordViewModel(result),
    }),
  };
}
