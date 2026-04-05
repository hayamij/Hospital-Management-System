import { createHandler } from '../createHandler.js';
import { SendDoctorMessageViewModel, ViewDoctorMessagesViewModel } from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorMessagesControllers({ sendDoctorMessageUseCase, viewDoctorMessagesUseCase }) {
  return {
    viewMessages: createHandler({
      useCase: viewDoctorMessagesUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.query?.doctorId,
        patientId: req.query?.patientId,
        limit: req.query?.limit,
      }),
      mapOutput: (result) => new ViewDoctorMessagesViewModel(result),
    }),
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
