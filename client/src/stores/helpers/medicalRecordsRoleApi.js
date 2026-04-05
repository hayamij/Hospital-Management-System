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

export const addVisitNoteByRole = async ({ role, token, userId, patientId, note }) => {
  if (!isRole(role, 'doctor')) return false;

  await doctorApi.addVisitNote(token, patientId, {
    note,
    doctorId: userId,
  });

  return true;
};

export const createMedicalRecordByRole = async ({ role, token, userId, patientId }) => {
  if (!isRole(role, 'doctor')) return false;

  return doctorApi.createMedicalRecord(token, patientId, {
    doctorId: userId,
    patientId,
  });
};
