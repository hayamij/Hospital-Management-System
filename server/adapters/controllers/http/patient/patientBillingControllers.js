import { createHandler } from '../createHandler.js';
import {
  ViewBillingAndPaymentsViewModel,
  DownloadInvoiceViewModel,
  SubmitTransferPaymentViewModel,
} from '../../../viewmodels/patientViewModels.js';

const resolvePatientId = (req, fallback) =>
  req.user?.patientId ?? req.user?.id ?? fallback;

export function buildPatientBillingControllers({
  viewBillingAndPaymentsUseCase,
  downloadInvoiceUseCase,
  submitTransferPaymentUseCase,
}) {
  return {
    viewBillingAndPayments: createHandler({
      useCase: viewBillingAndPaymentsUseCase,
      mapInput: (req) => ({ patientId: resolvePatientId(req, req.query?.patientId), status: req.query?.status, page: req.query?.page, pageSize: req.query?.pageSize }),
      mapOutput: (result) => new ViewBillingAndPaymentsViewModel(result),
    }),
    downloadInvoice: createHandler({
      useCase: downloadInvoiceUseCase,
      mapInput: (req) => ({ invoiceId: req.params?.id, patientId: resolvePatientId(req, req.query?.patientId) }),
      mapOutput: (result) => new DownloadInvoiceViewModel(result),
    }),
    submitTransferPayment: createHandler({
      useCase: submitTransferPaymentUseCase,
      mapInput: (req) => ({
        patientId: resolvePatientId(req, req.body?.patientId),
        invoiceId: req.params?.invoiceId,
        amount: req.body?.amount,
        transferReference: req.body?.transferReference,
        note: req.body?.note,
        method: req.body?.method,
      }),
      mapOutput: (result) => new SubmitTransferPaymentViewModel(result),
      successStatus: 201,
    }),
  };
}
