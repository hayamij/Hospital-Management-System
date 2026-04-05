import { createHandler } from '../createHandler.js';
import { ManageBillingViewModel, ViewAdminBillingViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin billing actions
export function buildAdminBillingControllers({ manageBillingUseCase, viewBillingUseCase }) {
  return {
    viewBilling: createHandler({
      useCase: viewBillingUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        status: req.query?.status,
        patientId: req.query?.patientId,
        page: req.query?.page,
        pageSize: req.query?.pageSize,
      }),
      mapOutput: (result) => new ViewAdminBillingViewModel(result),
    }),
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
