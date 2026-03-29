const FALLBACK_DOCTORS = [
  { id: 'doc-1', name: 'Dr. Demo', specialty: 'Noi tong quat' },
  { id: 'doc-2', name: 'Dr. Nguyen Minh', specialty: 'Tim mach' },
  { id: 'doc-3', name: 'Dr. Tran Lan', specialty: 'Nhi khoa' },
  { id: 'doc-4', name: 'Dr. Hoang Vu', specialty: 'Da lieu' },
  { id: 'doc-5', name: 'Dr. Pham An', specialty: 'Tai mui hong' },
  { id: 'doc-6', name: 'Dr. Le Khoa', specialty: 'Than kinh' },
];

export const toAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E2E8F0&color=0F172A`;

export const normalizeDoctor = (source, index = 0) => {
  const id = source?.id || source?.doctorId || `doctor-${index + 1}`;
  const name = source?.fullName || source?.name || `Bac si ${index + 1}`;
  const specialty = source?.specialization || source?.specialty || '';

  return {
    id,
    name,
    specialty,
    avatar: source?.avatarUrl || source?.avatar || toAvatar(name),
  };
};

export const getFallbackDoctors = () => FALLBACK_DOCTORS.map(normalizeDoctor);

export const filterDoctors = ({ doctors = [], query = '', specialty = '' }) => {
  const keyword = String(query || '').trim().toLowerCase();
  const selectedSpecialty = String(specialty || '').trim().toLowerCase();

  return doctors.filter((doctor) => {
    const name = String(doctor?.name || '').toLowerCase();
    const doctorSpecialty = String(doctor?.specialty || '').toLowerCase();

    const matchName = !keyword || name.includes(keyword);
    const matchSpecialty = !selectedSpecialty || doctorSpecialty === selectedSpecialty;
    return matchName && matchSpecialty;
  });
};

export const listSpecialties = (doctors = []) => {
  const set = new Set();
  for (const doctor of doctors) {
    if (doctor?.specialty) set.add(doctor.specialty);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

export const loadDoctorDirectory = async (guestApi, { query = '', specialty = '' } = {}) => {
  const response = await guestApi.searchDoctors({ query, specialty });
  const list = Array.isArray(response?.doctors) ? response.doctors : [];

  if (list.length === 0) {
    return getFallbackDoctors();
  }

  return list.map(normalizeDoctor);
};
