import { createHandler } from '../createHandler.js';
import { AssignRolesViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin user & role management
export function buildAdminUsersControllers({ assignRolesUseCase, manageUserStatusUseCase }) {
  return {
    assignRoles: createHandler({
      useCase: assignRolesUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        userId: req.params?.userId,
        role: req.body?.role,
      }),
      mapOutput: (result) => new AssignRolesViewModel(result),
    }),
    manageUserStatus: createHandler({
      useCase: manageUserStatusUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        userId: req.params?.userId,
        action: req.body?.action,
      }),
    }),
  };
}
