import { doctorApi, patientApi } from '../../services/api.js';
import { isRole } from '../../constants/navigation.js';

export const sendMessageByRole = async ({ role, token, userId, patientId, doctorId, payload }) => {
  if (isRole(role, 'patient')) {
    await patientApi.sendMessage(token, {
      patientId: patientId || userId,
      doctorId: payload?.doctorId,
      subject: payload?.subject,
      message: payload?.message,
    });
    return true;
  }

  if (isRole(role, 'doctor')) {
    await doctorApi.sendMessage(token, {
      doctorId: doctorId || userId,
      patientId: payload?.patientId,
      content: payload?.message,
    });
    return true;
  }

  return false;
};

export const fetchMessagesByRole = async ({ role, token, userId, patientId, doctorId, filters = {} }) => {
  if (isRole(role, 'patient')) {
    return patientApi.listMessages(token, {
      ...filters,
      patientId: patientId || userId,
    });
  }

  if (isRole(role, 'doctor')) {
    return doctorApi.listMessages(token, {
      ...filters,
      doctorId: doctorId || userId,
    });
  }

  return null;
};
