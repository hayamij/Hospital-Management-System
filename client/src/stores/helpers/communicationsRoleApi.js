import { doctorApi, patientApi } from '../../services/api.js';
import { isRole } from '../../constants/navigation.js';

export const sendMessageByRole = async ({ role, token, userId, payload }) => {
  if (isRole(role, 'patient')) {
    await patientApi.sendMessage(token, {
      patientId: userId,
      doctorId: payload?.doctorId,
      subject: payload?.subject,
      message: payload?.message,
    });
    return true;
  }

  if (isRole(role, 'doctor')) {
    await doctorApi.sendMessage(token, {
      doctorId: userId,
      patientId: payload?.patientId,
      content: payload?.message,
    });
    return true;
  }

  return false;
};
