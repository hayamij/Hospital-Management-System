import { guestApi, patientApi } from '../../services/api.js';
import { normalizeDoctor } from '../../services/mappers.js';

export const searchDoctorsByAuth = async ({ isAuthenticated, filters = {} }) => {
  const query = {
    query: filters?.query,
    specialty: filters?.specialty,
    page: filters?.page,
    pageSize: filters?.pageSize,
  };

  return isAuthenticated
    ? patientApi.searchDoctors(query)
    : guestApi.searchDoctors(query);
};

export const mapDoctorsSearchResult = (response) => ({
  list: Array.isArray(response?.doctors) ? response.doctors.map(normalizeDoctor) : [],
  total: response?.total || 0,
});
