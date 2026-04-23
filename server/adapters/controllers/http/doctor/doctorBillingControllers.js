import { createHandler } from '../createHandler.js';
import {
	ReviewTransferPaymentViewModel,
	ViewDoctorBillingsViewModel,
	ViewPendingPaymentsViewModel,
} from '../../../viewmodels/doctorViewModels.js';

const resolveDoctorId = (req, fallback) =>
	req.user?.doctorId ?? fallback ?? null;

export function buildDoctorBillingControllers({
	viewPendingPaymentsUseCase,
	reviewTransferPaymentUseCase,
	viewDoctorBillingUseCase,
}) {
	return {
		viewBilling: createHandler({
			useCase: viewDoctorBillingUseCase,
			mapInput: (req) => ({
				doctorId: resolveDoctorId(req, req.query?.doctorId),
				status: req.query?.status,
				page: req.query?.page,
				pageSize: req.query?.pageSize,
			}),
			mapOutput: (result) => new ViewDoctorBillingsViewModel(result),
		}),
		viewPendingPayments: createHandler({
			useCase: viewPendingPaymentsUseCase,
			mapInput: (req) => ({
				doctorId: resolveDoctorId(req, req.query?.doctorId),
				status: req.query?.status,
				page: req.query?.page,
				pageSize: req.query?.pageSize,
			}),
			mapOutput: (result) => new ViewPendingPaymentsViewModel(result),
		}),
		reviewTransferPayment: createHandler({
			useCase: reviewTransferPaymentUseCase,
			mapInput: (req) => ({
				doctorId: resolveDoctorId(req, req.body?.doctorId),
				paymentId: req.params?.paymentId,
				decision: req.body?.decision,
				note: req.body?.note,
			}),
			mapOutput: (result) => new ReviewTransferPaymentViewModel(result),
		}),
	};
}
