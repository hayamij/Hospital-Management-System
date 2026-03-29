export const icd10Regex = /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/i;

export const mapRecordRows = (records) =>
  (records || []).map((item, idx) => ({
    id: item.id || item.recordId || `record-${idx + 1}`,
    recordedAt: item.recordedAt || item.visitDate || item.createdAt || null,
    doctorId: item.doctorId || '-',
    note: item.note || item.description || item.diagnosis || '-',
    description: item.description || '',
  }));

export const buildConsultationErrors = ({ activePatientId, form }) => {
  const errors = {};

  if (!activePatientId) {
    errors.patient = 'Vui long chon benh nhan truoc khi luu.';
  }

  if (!form.clinicalNote || form.clinicalNote.length < 10) {
    errors.clinicalNote = 'Ghi chu lam sang can toi thieu 10 ky tu.';
  }

  if (!form.icd10 || !icd10Regex.test(form.icd10)) {
    errors.icd10 = 'Ma ICD-10 khong hop le (vi du: J20.9).';
  }

  if (!form.prescription || form.prescription.length < 5) {
    errors.prescription = 'Noi dung ke don thuoc can toi thieu 5 ky tu.';
  }

  if (!form.labOrders || form.labOrders.length < 3) {
    errors.labOrders = 'Chi dinh xet nghiem can toi thieu 3 ky tu.';
  }

  return errors;
};

export const buildConsultationNoteBlock = (form) =>
  [
    `Clinical: ${form.clinicalNote}`,
    `ICD10: ${String(form.icd10 || '').toUpperCase()}`,
    `Prescription: ${form.prescription}`,
    `Lab Orders: ${form.labOrders}`,
  ].join('\n');

export const formatDateTime = (value) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
