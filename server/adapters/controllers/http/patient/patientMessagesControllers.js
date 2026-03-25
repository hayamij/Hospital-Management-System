import { createHandler } from '../createHandler.js';
import { SendPatientMessageViewModel } from '../../../viewmodels/patientViewModels.js';

export function buildPatientMessagesControllers({ sendPatientMessageUseCase }) {
  return {
    sendPatientMessage: createHandler({
      useCase: sendPatientMessageUseCase,
      mapInput: (req) => ({ patientId: req.user?.id ?? req.body?.patientId, doctorId: req.body?.doctorId, subject: req.body?.subject, message: req.body?.message }),
      mapOutput: (result) => new SendPatientMessageViewModel(result),
      successStatus: 201,
    }),
  };
}
