import { createHandler } from '../createHandler.js';
import { SendDoctorMessageViewModel } from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorMessagesControllers({ sendDoctorMessageUseCase }) {
  return {
    sendMessage: createHandler({
      useCase: sendDoctorMessageUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        patientId: req.body?.patientId,
        content: req.body?.content ?? req.body?.message,
      }),
      mapOutput: (result) => new SendDoctorMessageViewModel(result),
      successStatus: 201,
    }),
  };
}
