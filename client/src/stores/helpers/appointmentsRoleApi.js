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
  doctorId,
  patientId,
  filters = {},
  page = 1,
  pageSize = 10,
}) => {
  if (isRole(role, 'patient')) {
    const response = await patientApi.listAppointments(token, {
      ...filters,
      page: filters.page || page,
      pageSize: filters.pageSize || pageSize,
      patientId: patientId || userId,
    });
    return { response, ...toPagedResult(response, pageSize) };
  }

  if (isRole(role, 'doctor')) {
    const params = {
      ...filters,
      page: filters.page || page,
      pageSize: filters.pageSize || pageSize,
    };
    if (doctorId) {
      params.doctorId = doctorId;
    }

    const response = await doctorApi.getSchedule(token, params);
    return { response, ...toPagedResult(response, pageSize) };
  }

  if (isRole(role, 'admin')) {
    const response = await adminApi.listAppointments(token, {
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
  doctorId,
  appointmentId,
  payload,
}) => {
  const actorDoctorId = doctorId || null;

  if (isRole(role, 'doctor')) {
    const doctorPayload = actorDoctorId
      ? { ...payload, doctorId: actorDoctorId }
      : { ...payload };

    if (payload?.decision) {
      return doctorApi.updateAppointmentDecision(token, appointmentId, doctorPayload);
    } else {
      return doctorApi.updateAppointmentStatus(token, appointmentId, doctorPayload);
    }
  }

  if (isRole(role, 'admin')) {
    return adminApi.overrideAppointment(token, appointmentId, payload);
  }

  return false;
};
