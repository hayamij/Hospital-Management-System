import { createHandler } from '../createHandler.js';
import { SendPatientMessageViewModel } from '../../../viewmodels/patientViewModels.js';

const resolvePatientId = (req, fallback) =>
  req.user?.patientId ?? req.user?.id ?? fallback;

export function buildPatientMessagesControllers({ sendPatientMessageUseCase }) {
  return {
    sendPatientMessage: createHandler({
      useCase: sendPatientMessageUseCase,
      mapInput: (req) => ({ patientId: resolvePatientId(req, req.body?.patientId), doctorId: req.body?.doctorId, subject: req.body?.subject, message: req.body?.message }),
      mapOutput: (result) => new SendPatientMessageViewModel(result),
      successStatus: 201,
    }),
  };
}
