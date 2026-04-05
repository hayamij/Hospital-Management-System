export const ROLE_HOME_ROUTE = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  patient: '/patient/dashboard',
};

export const AUTH_ROUTE = {
  login: '/login',
  register: '/register',
};

export const ROLE_DISPLAY_LABEL = {
  admin: 'Admin',
  doctor: 'Bác sĩ',
  patient: 'Bệnh nhân',
};

const KNOWN_ROLES = new Set(Object.keys(ROLE_HOME_ROUTE));

export const normalizeRole = (role, fallback = null) => {
  if (typeof role !== 'string') return fallback;
  const normalized = role.toLowerCase();
  return KNOWN_ROLES.has(normalized) ? normalized : fallback;
};

export const getRoleHomeRoute = (role, fallback = '/') => {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_HOME_ROUTE[normalized] : fallback;
};

export const getRoleRedirectPath = (role, roleMap, fallback = '/') => {
  const normalized = normalizeRole(role);
  if (normalized && roleMap && roleMap[normalized]) {
    return roleMap[normalized];
  }
  return fallback;
};

export const getRoleDisplayLabel = (role, fallback = 'Tài khoản') => {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_DISPLAY_LABEL[normalized] || fallback : fallback;
};

export const getUserTypeFromRole = (role, fallback = 'patient') => {
  return normalizeRole(role, fallback) || fallback;
};

export const getUserTypeFromSource = (source, fallback = 'patient') => {
  if (source?.type) return source.type;
  return getUserTypeFromRole(source?.role, fallback);
};

export const isRole = (role, expectedRole) => normalizeRole(role) === normalizeRole(expectedRole);

export const PUBLIC_HEADER_LINKS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Dịch vụ', to: '/services' },
  { label: 'Bác sĩ', to: '/doctors' },
  { label: 'Tin tức', to: '/news' },
  { label: 'Giới thiệu', to: '/about' },
];

export const BACKOFFICE_SIDEBAR_ITEMS = {
  doctor: [
    { label: 'Vận hành bác sĩ', path: '/doctor/dashboard', icon: 'DO' },
    { label: 'Khám bệnh', path: '/doctor/consultation', icon: 'CS' },
    { label: 'Lịch hẹn', path: '/doctor/appointments', icon: 'SC' },
    { label: 'Xét nghiệm', path: '/doctor/lab-results', icon: 'LB' },
    { label: 'Bệnh nhân', path: '/doctor/patients', icon: 'PT' },
    { label: 'Hồ sơ', path: '/doctor/records', icon: 'MR' },
    { label: 'Hồ sơ bác sĩ', path: '/doctor/profile', icon: 'PR' },
    { label: 'Tin nhắn', path: '/doctor/communications', icon: 'MS' },
  ],
  admin: [
    { label: 'Bảng điều khiển', path: '/admin/dashboard', icon: 'DB' },
    { label: 'Quản lý nhân sự', path: '/admin/staff', icon: 'HR' },
    { label: 'Quản lý bệnh nhân', path: '/admin/patients', icon: 'PT' },
    { label: 'Quản lý dịch vụ', path: '/admin/services', icon: 'SV' },
    { label: 'Lịch trình', path: '/admin/appointments', icon: 'SC' },
    { label: 'Tài chính', path: '/admin/billing', icon: 'FN' },
  ],
};
