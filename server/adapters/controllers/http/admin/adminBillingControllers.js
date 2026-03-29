import { createHandler } from '../createHandler.js';
import { ManageBillingViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin billing actions
export function buildAdminBillingControllers({ manageBillingUseCase }) {
  return {
    manageBilling: createHandler({
      useCase: manageBillingUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        invoiceId: req.params?.invoiceId,
        action: req.body?.action,
        dueDate: req.body?.dueDate,
      }),
      mapOutput: (result) => new ManageBillingViewModel(result),
    }),
  };
}
