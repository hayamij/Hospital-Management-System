const toDate = (value) => {
  const d = new Date(value || '');
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toTimestamp = (value) => {
  const t = new Date(value || '').getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
};

export const normalizeDoctor = (source, index = 0) => ({
  id: source?.id || source?.doctorId || `doctor-${index + 1}`,
  name: source?.fullName || source?.name || `Doctor ${index + 1}`,
  specialty: source?.specialization || source?.specialty || 'General',
  status: source?.status || 'active',
  email: source?.email || '',
});

export const normalizeAppointment = (source, index = 0) => ({
  key: source?.id || source?.appointmentId || `appointment-${index + 1}`,
  date: source?.appointmentDate || source?.date || source?.scheduledAt || source?.startAt || '',
  startDate: toDate(source?.startAt || source?.appointmentDate || source?.date || source?.scheduledAt || ''),
  serviceName: source?.serviceName || source?.reason || source?.service || 'Kham tong quat',
  doctorName: source?.doctorName || source?.doctorFullName || source?.doctor || 'Dang cap nhat',
  status: source?.status || 'pending',
});

export const normalizeRecord = (source, index = 0) => ({
  key: source?.id || source?.recordId || `record-${index + 1}`,
  type: 'Ket qua kham',
  date: source?.visitDate || source?.recordedAt || source?.createdAt || source?.updatedAt || '',
  title: source?.title || source?.diagnosis || 'Phieu ket qua kham',
  description: source?.summary || source?.note || source?.result || 'Thong tin ket qua dang duoc cap nhat.',
  amount: null,
});

export const normalizeInvoice = (source, index = 0) => ({
  key: source?.id || source?.invoiceId || `billing-${index + 1}`,
  type: 'Hoa don',
  date: source?.issuedAt || source?.createdAt || source?.updatedAt || '',
  title: source?.title || source?.code || source?.invoiceNumber || 'Hoa don dich vu',
  description: source?.note || source?.status || 'Thong tin hoa don gan nhat.',
  amount: source?.amount ?? source?.totalAmount ?? source?.total ?? null,
});
