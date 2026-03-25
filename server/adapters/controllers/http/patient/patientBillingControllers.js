import { createHandler } from '../createHandler.js';
import { ViewBillingAndPaymentsViewModel, DownloadInvoiceViewModel } from '../../../viewmodels/patientViewModels.js';

export function buildPatientBillingControllers({ viewBillingAndPaymentsUseCase, downloadInvoiceUseCase }) {
  return {
    viewBillingAndPayments: createHandler({
      useCase: viewBillingAndPaymentsUseCase,
      mapInput: (req) => ({ patientId: req.user?.id ?? req.query?.patientId, status: req.query?.status, page: req.query?.page, pageSize: req.query?.pageSize }),
      mapOutput: (result) => new ViewBillingAndPaymentsViewModel(result),
    }),
    downloadInvoice: createHandler({
      useCase: downloadInvoiceUseCase,
      mapInput: (req) => ({ invoiceId: req.params?.id, patientId: req.user?.id ?? req.query?.patientId }),
      mapOutput: (result) => new DownloadInvoiceViewModel(result),
    }),
  };
}
