import { createHandler } from '../createHandler.js';
import { SendPatientMessageViewModel, ViewPatientMessagesViewModel } from '../../../viewmodels/patientViewModels.js';

const resolvePatientId = (req, fallback) =>
  req.user?.patientId ?? req.user?.id ?? fallback;

export function buildPatientMessagesControllers({ sendPatientMessageUseCase, viewPatientMessagesUseCase }) {
  return {
    viewMessages: createHandler({
      useCase: viewPatientMessagesUseCase,
      mapInput: (req) => ({
        patientId: resolvePatientId(req, req.query?.patientId),
        doctorId: req.query?.doctorId,
        limit: req.query?.limit,
      }),
      mapOutput: (result) => new ViewPatientMessagesViewModel(result),
    }),
    sendPatientMessage: createHandler({
      useCase: sendPatientMessageUseCase,
      mapInput: (req) => ({ patientId: resolvePatientId(req, req.body?.patientId), doctorId: req.body?.doctorId, subject: req.body?.subject, message: req.body?.message }),
      mapOutput: (result) => new SendPatientMessageViewModel(result),
      successStatus: 201,
    }),
  };
}
