import { doctorApi, patientApi } from '../../services/api.js';
import { isRole } from '../../constants/navigation.js';

export const fetchRecordsByRole = async ({ role, token, userId, patientId, filters = {} }) => {
  if (isRole(role, 'patient')) {
    return patientApi.listRecords(token, { ...filters, patientId: patientId || userId });
  }

  if (isRole(role, 'doctor') && filters.patientId) {
    return doctorApi.viewPatientRecords(token, filters.patientId, filters);
  }

  return null;
};

export const addVisitNoteByRole = async ({ role, token, userId, doctorId, patientId, note }) => {
  if (!isRole(role, 'doctor')) return false;
  const actorDoctorId = doctorId || null;

  const payload = {
    note,
  };
  if (actorDoctorId) {
    payload.doctorId = actorDoctorId;
  }

  await doctorApi.addVisitNote(token, patientId, payload);

  return true;
};

export const createMedicalRecordByRole = async ({ role, token, userId, doctorId, patientId }) => {
  if (!isRole(role, 'doctor')) return false;
  const actorDoctorId = doctorId || null;

  const payload = {
    patientId,
  };
  if (actorDoctorId) {
    payload.doctorId = actorDoctorId;
  }

  return doctorApi.createMedicalRecord(token, patientId, payload);
};
