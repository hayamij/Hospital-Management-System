import { createHandler } from '../createHandler.js';
import { AssignRolesViewModel, CreateUserViewModel, ListUsersViewModel, UpdateUserViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin user & role management
export function buildAdminUsersControllers({ listUsersUseCase, createUserUseCase, updateUserUseCase, assignRolesUseCase, manageUserStatusUseCase }) {
  return {
    listUsers: createHandler({
      useCase: listUsersUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        query: req.query?.q ?? req.query?.query,
        type: req.query?.type,
        page: req.query?.page,
        pageSize: req.query?.pageSize,
      }),
      mapOutput: (result) => new ListUsersViewModel(result),
    }),
    createUser: createHandler({
      useCase: createUserUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        fullName: req.body?.fullName,
        email: req.body?.email,
        role: req.body?.role,
        status: req.body?.status,
        password: req.body?.password,
      }),
      mapOutput: (result) => new CreateUserViewModel(result),
      successStatus: 201,
    }),
    updateUser: createHandler({
      useCase: updateUserUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        userId: req.params?.userId,
        fullName: req.body?.fullName,
        email: req.body?.email,
        role: req.body?.role,
        status: req.body?.status,
      }),
      mapOutput: (result) => new UpdateUserViewModel(result),
    }),
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
