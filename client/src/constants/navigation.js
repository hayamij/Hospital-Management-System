export const ROLE_HOME_ROUTE = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  patient: '/patient/dashboard',
};

export const ROLE_DISPLAY_LABEL = {
  admin: 'Admin',
  doctor: 'Bác sĩ',
  patient: 'Bệnh nhân',
};

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
    { label: 'Quản lý nhân sự', path: '/admin/ops#staff', icon: 'HR' },
    { label: 'Quản lý bệnh nhân', path: '/admin/patients', icon: 'PT' },
    { label: 'Quản lý dịch vụ', path: '/admin/ops#services', icon: 'SV' },
    { label: 'Lịch trình', path: '/admin/appointments', icon: 'SC' },
    { label: 'Tài chính', path: '/admin/billing', icon: 'FN' },
  ],
};
