import { createHandler } from '../createHandler.js';
import { SendDoctorMessageViewModel, ViewDoctorMessagesViewModel } from '../../../viewmodels/doctorViewModels.js';

const resolveDoctorId = (req, fallback) =>
  req.user?.doctorId ?? req.user?.id ?? fallback;

export function buildDoctorMessagesControllers({ sendDoctorMessageUseCase, viewDoctorMessagesUseCase }) {
  return {
    viewMessages: createHandler({
      useCase: viewDoctorMessagesUseCase,
      mapInput: (req) => ({
        doctorId: resolveDoctorId(req, req.query?.doctorId),
        patientId: req.query?.patientId,
        limit: req.query?.limit,
      }),
      mapOutput: (result) => new ViewDoctorMessagesViewModel(result),
    }),
    sendMessage: createHandler({
      useCase: sendDoctorMessageUseCase,
      mapInput: (req) => ({
        doctorId: resolveDoctorId(req, req.body?.doctorId),
        patientId: req.body?.patientId,
        content: req.body?.content ?? req.body?.message,
      }),
      mapOutput: (result) => new SendDoctorMessageViewModel(result),
      successStatus: 201,
    }),
  };
}
