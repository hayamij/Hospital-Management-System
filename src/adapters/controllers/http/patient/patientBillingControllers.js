import { createHandler } from '../createHandler.js';
import { ViewBillingAndPaymentsViewModel } from '../../../viewmodels/patientViewModels.js';

export function buildPatientBillingControllers({ viewBillingAndPaymentsUseCase }) {
  return {
    viewBillingAndPayments: createHandler({
      useCase: viewBillingAndPaymentsUseCase,
      mapInput: (req) => ({ patientId: req.user?.id ?? req.query?.patientId, status: req.query?.status, page: req.query?.page, pageSize: req.query?.pageSize }),
      mapOutput: (result) => new ViewBillingAndPaymentsViewModel(result),
    }),
  };
}
