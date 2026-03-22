const now = () => new Date().toISOString();
const makeUseCase = (fn) => ({ execute: fn });
const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

// In-memory mock data (mutated by use cases to mimic a lightweight DB)
const doctors = [
  { id: 'doc-1', name: 'Dr. Strange', specialization: 'Surgery', slotsPerDay: 8 },
  { id: 'doc-2', name: 'Dr. Grey', specialization: 'Neurology', slotsPerDay: 10 },
];

const users = [
  { id: 'admin-1', email: 'admin@example.com', role: 'admin', status: 'active' },
  { id: 'doc-1', email: 'doc1@example.com', role: 'doctor', status: 'active' },
  { id: 'pat-1', email: 'pat1@example.com', role: 'patient', status: 'active' },
];

const patients = [{ id: 'pat-1', name: 'Alice Patient', contact: { email: 'pat1@example.com' } }];
const appointments = [
  { id: 'apt-1', patientId: 'pat-1', doctorId: 'doc-1', startAt: now(), endAt: now(), status: 'scheduled' },
];
const billings = [
  { id: 'inv-1', patientId: 'pat-1', status: 'open', dueDate: now(), total: 120 },
];
const payments = [];
const medicalRecords = [{ id: 'rec-1', patientId: 'pat-1', summary: 'Checkup', createdAt: now() }];
const services = [
  { id: 'svc-1', name: 'Consultation', price: 50 },
  { id: 'svc-2', name: 'Lab Test', price: 70 },
];
const settings = { timezone: 'UTC', currency: 'USD', updatedAt: now() };
const contacts = [];

export function createMockDeps() {
  return {
    // Auth
    loginUseCase: makeUseCase(async (input) => ({ userId: input.email ?? 'user-1', accessToken: 'mock-token', role: 'patient' })),
    logoutUseCase: makeUseCase(async () => ({ success: true })),
    resetPasswordUseCase: makeUseCase(async () => ({ success: true })),

    // Patient appointments
    scheduleAppointmentUseCase: makeUseCase(async (input) => {
      const id = uid('apt');
      const appointment = { id, patientId: input.patientId, doctorId: input.doctorId, startAt: input.startAt, endAt: input.endAt, status: 'scheduled' };
      appointments.push(appointment);
      return { appointmentId: id, status: 'scheduled', startAt: appointment.startAt, endAt: appointment.endAt };
    }),
    rescheduleAppointmentUseCase: makeUseCase(async (input) => {
      const found = appointments.find((a) => a.id === input.appointmentId);
      if (found) {
        found.startAt = input.startAt;
        found.endAt = input.endAt;
        found.status = 'rescheduled';
      }
      return { appointmentId: input.appointmentId, status: 'rescheduled', startAt: input.startAt, endAt: input.endAt };
    }),
    cancelAppointmentUseCase: makeUseCase(async (input) => {
      const found = appointments.find((a) => a.id === input.appointmentId);
      if (found) found.status = 'cancelled';
      return { appointmentId: input.appointmentId, status: 'cancelled', cancelledAt: now() };
    }),
    viewAppointmentsUseCase: makeUseCase(async (input) => {
      const filtered = appointments.filter((a) => (!input.patientId || a.patientId === input.patientId) && (!input.doctorId || a.doctorId === input.doctorId));
      return { page: 1, pageSize: filtered.length, total: filtered.length, appointments: filtered };
    }),

    // Patient billing & records
    viewBillingAndPaymentsUseCase: makeUseCase(async (input) => {
      const filtered = billings.filter((b) => !input.patientId || b.patientId === input.patientId);
      const payFiltered = payments.filter((p) => !input.patientId || p.patientId === input.patientId);
      return { page: 1, pageSize: filtered.length, total: filtered.length, billings: filtered, payments: payFiltered };
    }),
    viewMedicalRecordsUseCase: makeUseCase(async (input) => {
      const records = medicalRecords.filter((r) => !input.patientId || r.patientId === input.patientId);
      return { page: 1, pageSize: records.length, total: records.length, records };
    }),
    downloadPrescriptionUseCase: makeUseCase(async (input) => ({ prescriptionId: input.prescriptionId, file: 'https://example.com/prescription.pdf', filename: 'prescription.pdf' })),
    sendPatientMessageUseCase: makeUseCase(async () => ({ messageId: uid('msg'), status: 'sent', sentAt: now() })),

    // Patient discovery/profile
    searchDoctorsUseCase: makeUseCase(async () => ({ page: 1, pageSize: doctors.length, total: doctors.length, doctors })),
    registerPatientAccountUseCase: makeUseCase(async (input) => {
      const id = uid('pat');
      patients.push({ id, name: input.name ?? 'New Patient', contact: { email: input.email } });
      users.push({ id, email: input.email, role: 'patient', status: 'active' });
      return { patientId: id, userId: id, status: 'registered' };
    }),
    updatePatientProfileUseCase: makeUseCase(async (input) => ({ patientId: input.patientId, updatedAt: now() })),

    // Guest
    browsePublicInfoUseCase: makeUseCase(async () => ({ services })),
    guestSearchDoctorsUseCase: makeUseCase(async () => ({ page: 1, pageSize: doctors.length, total: doctors.length, doctors })),
    startRegistrationUseCase: makeUseCase(async (input) => {
      const registrationId = uid('reg');
      patients.push({ id: registrationId, name: input.name ?? 'Guest Patient', contact: { email: input.email } });
      return { registrationId, status: 'started' };
    }),
    submitContactFormUseCase: makeUseCase(async (input) => {
      const record = { id: uid('lead'), ...input, receivedAt: now() };
      contacts.push(record);
      return { receivedAt: record.receivedAt };
    }),
    viewAvailableSlotsUseCase: makeUseCase(async () => ({ slots: [{ start: now(), end: now() }] })),

    // Doctor access & schedule
    doctorLoginUseCase: makeUseCase(async (input) => ({ doctorId: input.email ?? 'doc-1', accessToken: 'doctor-token' })),
    viewDoctorScheduleUseCase: makeUseCase(async (input) => ({ appointments: appointments.filter((a) => !input.doctorId || a.doctorId === input.doctorId) })),
    manageAppointmentDecisionUseCase: makeUseCase(async (input) => {
      const found = appointments.find((a) => a.id === input.appointmentId);
      if (found) found.status = input.decision ?? 'approved';
      return { appointmentId: input.appointmentId, status: input.decision ?? 'approved' };
    }),
    markAppointmentStatusUseCase: makeUseCase(async (input) => {
      const found = appointments.find((a) => a.id === input.appointmentId);
      if (found) found.status = input.status ?? 'in_progress';
      return { appointmentId: input.appointmentId, status: input.status ?? 'in_progress' };
    }),

    // Doctor records/profile/messages
    accessPatientChartUseCase: makeUseCase(async (input) => ({ patientId: input.patientId, chart: { visits: [], medications: [] } })),
    addVisitNoteUseCase: makeUseCase(async (input) => ({ patientId: input.patientId, noteId: uid('note') })),
    updateMedicalRecordEntryUseCase: makeUseCase(async (input) => ({ recordId: input.recordId, status: 'updated' })),
    reviewTestResultsUseCase: makeUseCase(async (input) => ({ labResultId: input.labResultId, status: 'reviewed' })),
    updateDoctorProfileUseCase: makeUseCase(async (input) => {
      const doc = doctors.find((d) => d.id === input.doctorId);
      if (doc) Object.assign(doc, input.profile ?? {});
      return { updatedAt: now() };
    }),
    sendDoctorMessageUseCase: makeUseCase(async () => ({ messageId: uid('msg'), status: 'sent', sentAt: now() })),

    // Admin
    adminLoginUseCase: makeUseCase(async () => ({ adminId: 'admin-1', accessToken: 'admin-token' })),
    assignRolesUseCase: makeUseCase(async (input) => {
      const user = users.find((u) => u.id === input.userId);
      if (user) user.role = input.role ?? user.role;
      return { updatedAt: now(), userId: input.userId, role: user?.role ?? input.role };
    }),
    manageUserStatusUseCase: makeUseCase(async (input) => {
      const user = users.find((u) => u.id === input.userId);
      if (user) user.status = input.status ?? user.status;
      return { updatedAt: now(), userId: input.userId, status: user?.status ?? input.status };
    }),
    setDoctorSlotsUseCase: makeUseCase(async (input) => {
      const doc = doctors.find((d) => d.id === input.doctorId);
      if (doc) doc.slotsPerDay = input.slotsPerDay ?? doc.slotsPerDay;
      return { updatedAt: now(), doctorId: input.doctorId, slotsPerDay: doc?.slotsPerDay };
    }),
    overrideAppointmentUseCase: makeUseCase(async (input) => {
      const found = appointments.find((a) => a.id === input.appointmentId);
      if (found) found.status = input.status ?? 'overridden';
      return { status: found?.status ?? 'overridden', updatedAt: now() };
    }),
    manageBillingUseCase: makeUseCase(async (input) => {
      let bill = billings.find((b) => b.id === input.invoiceId);
      if (!bill) {
        bill = { id: input.invoiceId ?? uid('inv'), patientId: input.patientId ?? 'pat-1', status: 'open', dueDate: input.dueDate ?? now(), total: 0 };
        billings.push(bill);
      }
      if (input.action === 'markPaid') {
        bill.status = 'paid';
        payments.push({ id: uid('pay'), patientId: bill.patientId, invoiceId: bill.id, amount: bill.total ?? 0, paidAt: now() });
      }
      if (input.action === 'void') bill.status = 'void';
      if (input.action === 'issue') {
        bill.status = 'open';
        bill.dueDate = input.dueDate ?? bill.dueDate;
      }
      return { invoiceId: bill.id, status: bill.status, dueDate: bill.dueDate };
    }),
    upsertServiceUseCase: makeUseCase(async (input) => {
      let svc = services.find((s) => s.id === input.id);
      if (!svc) {
        svc = { id: input.id ?? uid('svc'), name: input.name, price: input.price ?? 0 };
        services.push(svc);
      } else {
        Object.assign(svc, { name: input.name ?? svc.name, price: input.price ?? svc.price });
      }
      return svc;
    }),
    removeServiceUseCase: makeUseCase(async (input) => {
      const idx = services.findIndex((s) => s.id === input.serviceId);
      if (idx >= 0) services.splice(idx, 1);
      return { removed: input.serviceId };
    }),
    updateSettingsUseCase: makeUseCase(async (input) => {
      Object.assign(settings, input ?? {}, { updatedAt: now() });
      return { updatedAt: settings.updatedAt };
    }),
    runReportUseCase: makeUseCase(async () => ({
      reportId: 'rep-1',
      counts: { patients: patients.length, doctors: doctors.length, appointments: appointments.length },
      totals: { revenue: billings.reduce((s, b) => s + (b.total ?? 0), 0) },
      generatedAt: now(),
    })),
    auditRecordUseCase: makeUseCase(async (input) => ({ recordId: input.recordId, status: 'audited', auditedAt: now() })),
  };
}
