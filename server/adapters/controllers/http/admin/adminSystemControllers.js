import { createHandler } from '../createHandler.js';
import { UpdateSystemSettingsViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin system settings
export function buildAdminSystemControllers({ manageSystemSettingsUseCase }) {
  return {
    updateSettings: createHandler({
      useCase: manageSystemSettingsUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        settings: req.body,
      }),
      mapOutput: (result) => new UpdateSystemSettingsViewModel(result),
    }),
  };
}
