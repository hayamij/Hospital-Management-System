// Shared stub deps for HTTP adapter tests.
// Each use case is represented by an object with an async execute(input) returning a canned result.

const baseResults = {
  // Patients
  scheduleAppointmentUseCase: { appointmentId: 'apt-1', status: 'scheduled', startAt: '2026-04-01T10:00:00Z', endAt: '2026-04-01T10:30:00Z' },
  rescheduleAppointmentUseCase: { appointmentId: 'apt-1', status: 'rescheduled', startAt: '2026-04-02T11:00:00Z', endAt: '2026-04-02T11:30:00Z' },
  cancelAppointmentUseCase: { appointmentId: 'apt-1', status: 'cancelled', cancelledAt: '2026-04-01T08:00:00Z' },
  viewAppointmentsUseCase: { page: 1, pageSize: 10, total: 0, appointments: [] },
  viewBillingAndPaymentsUseCase: { page: 1, pageSize: 10, total: 0, billings: [], payments: [] },
  downloadInvoiceUseCase: { invoiceId: 'inv-1', file: '{"invoiceId":"inv-1"}', filename: 'inv-1.json', contentType: 'application/json' },
  viewMedicalRecordsUseCase: { page: 1, pageSize: 10, total: 0, records: [] },
  downloadPrescriptionUseCase: { prescriptionId: 'rx-1', file: 'PDFDATA', filename: 'rx.pdf' },
  searchDoctorsUseCase: { page: 1, pageSize: 10, total: 0, doctors: [] },
  sendPatientMessageUseCase: { messageId: 'msg-1', status: 'sent', sentAt: '2026-04-01T09:00:00Z' },
  registerPatientAccountUseCase: { patientId: 'pat-1', userId: 'user-1', status: 'active' },
  updatePatientProfileUseCase: { patientId: 'pat-1', updatedAt: '2026-04-01T09:30:00Z' },

  // Guests
  browsePublicInfoUseCase: { ok: true },
  guestSearchDoctorsUseCase: { page: 1, pageSize: 10, total: 0, doctors: [] },
  startRegistrationUseCase: { leadId: 'lead-1' },
  submitContactFormUseCase: { contactId: 'contact-1' },
  viewAvailableSlotsUseCase: { slots: [] },

  // Auth
  loginUseCase: { userId: 'user-1', token: 'token-user', role: 'patient' },
  logoutUseCase: { ok: true },
  resetPasswordUseCase: { ok: true },

  // Doctors
  doctorLoginUseCase: { userId: 'doc-1', token: 'token-doc', role: 'doctor' },
  viewDoctorScheduleUseCase: { page: 1, pageSize: 10, total: 0, appointments: [] },
  manageAppointmentDecisionUseCase: { appointmentId: 'apt-1', status: 'accepted', updatedAt: '2026-04-01T12:00:00Z' },
  markAppointmentStatusUseCase: { appointmentId: 'apt-1', status: 'done', updatedAt: '2026-04-01T13:00:00Z' },
  accessPatientChartUseCase: { page: 1, pageSize: 10, total: 0, records: [] },
  addVisitNoteUseCase: { recordId: 'rec-1', entryId: 'entry-1', addedAt: '2026-04-01T12:30:00Z' },
  updateMedicalRecordEntryUseCase: { recordId: 'rec-1', entryId: 'entry-2', addedAt: '2026-04-01T12:45:00Z' },
  reviewTestResultsUseCase: { ok: true },
  updateDoctorProfileAndAvailabilityUseCase: { doctorId: 'doc-1', updatedAt: '2026-04-01T14:00:00Z' },
  sendDoctorMessageUseCase: { messageId: 'msg-2', status: 'sent', sentAt: '2026-04-01T14:10:00Z' },

  // Admin
  adminLoginUseCase: { userId: 'admin-1', token: 'token-admin', role: 'admin' },
  listUsersUseCase: { page: 1, pageSize: 10, total: 0, users: [] },
  createUserUseCase: { userId: 'user-3', fullName: 'User 3', email: 'user3@example.com', role: 'patient', status: 'active' },
  updateUserUseCase: { userId: 'user-2', fullName: 'Updated User', email: 'updated@example.com', role: 'patient', status: 'active' },
  assignRolesUseCase: { userId: 'user-2', roles: ['admin'] },
  manageUsersUseCase: { userId: 'user-2', action: 'disabled' },
  manageDoctorSchedulesUseCase: { doctorId: 'doc-1', slotsPerDay: 4 },
  overrideAppointmentUseCase: { appointmentId: 'apt-1', status: 'overridden', updatedAt: '2026-04-01T15:00:00Z' },
  manageBillingUseCase: { invoiceId: 'inv-1', action: 'approve', dueDate: '2026-04-10' },
  configureServicesAndPricingUseCase: { itemId: 'svc-1', status: 'upserted' },
  manageSystemSettingsUseCase: { ok: true },
  runReportsUseCase: { reportId: 'report-1', url: 'https://example.com/report', generatedAt: '2026-04-01T16:00:00Z' },
  auditMedicalRecordsUseCase: { recordId: 'rec-1', action: 'audit' },
};

const wrap = (result) => ({ execute: async () => result });

export function makeDeps(overrides = {}) {
  const deps = {};
  for (const [name, result] of Object.entries(baseResults)) {
    deps[name] = overrides[name] ?? wrap(result);
  }
  // allow extra overrides not in baseResults
  for (const [name, uc] of Object.entries(overrides)) {
    if (!deps[name]) deps[name] = uc;
  }
  return deps;
}

export function expectJson(res) {
  if (!res?.body || typeof res.body !== 'object') {
    throw new Error('Response missing JSON body');
  }
  return res.body.data ?? res.body;
}
