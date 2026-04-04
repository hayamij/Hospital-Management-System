import { isRole } from '../../constants/navigation.js';

export const getDoctorPendingAppointments = (appointments = [], role) => {
  if (!isRole(role, 'doctor')) return [];

  return appointments.filter((item) => {
    const status = String(item?.status || '').toLowerCase();
    return status === 'pending' || status === 'requested';
  });
};

export const canRoleUpdateAppointmentStatus = (item, role) => {
  if (!isRole(role, 'doctor')) return false;

  const status = String(item?.status || '').toLowerCase();
  return status === 'scheduled' || status === 'in_progress';
};
