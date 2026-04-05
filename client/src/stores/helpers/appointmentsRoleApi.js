import { adminApi, doctorApi, patientApi } from '../../services/api.js';
import { isRole } from '../../constants/navigation.js';

const toPagedResult = (response, defaultPageSize) => ({
  items: response?.appointments || [],
  total: response?.total || 0,
  page: response?.page || 1,
  pageSize: response?.pageSize || defaultPageSize,
});

export const fetchAppointmentsByRole = async ({
  role,
  token,
  userId,
  filters = {},
  page = 1,
  pageSize = 10,
}) => {
  if (isRole(role, 'patient')) {
    const response = await patientApi.listAppointments(token, {
      ...filters,
      page: filters.page || page,
      pageSize: filters.pageSize || pageSize,
      patientId: userId,
    });
    return { response, ...toPagedResult(response, pageSize) };
  }

  if (isRole(role, 'doctor')) {
    const response = await doctorApi.getSchedule(token, {
      ...filters,
      page: filters.page || page,
      pageSize: filters.pageSize || pageSize,
    });
    return { response, ...toPagedResult(response, pageSize) };
  }

  return null;
};

export const updateAppointmentStatusByRole = async ({
  role,
  token,
  userId,
  appointmentId,
  payload,
}) => {
  if (isRole(role, 'doctor')) {
    if (payload?.decision) {
      await doctorApi.updateAppointmentDecision(token, appointmentId, { ...payload, doctorId: userId });
    } else {
      await doctorApi.updateAppointmentStatus(token, appointmentId, { ...payload, doctorId: userId });
    }
    return true;
  }

  if (isRole(role, 'admin')) {
    await adminApi.overrideAppointment(token, appointmentId, payload);
    return true;
  }

  return false;
};
