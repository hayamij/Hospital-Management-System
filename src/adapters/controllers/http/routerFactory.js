import express from 'express';
import { buildPatientAppointmentsControllers } from './patient/patientAppointmentsControllers.js';
import { buildPatientBillingControllers } from './patient/patientBillingControllers.js';
import { buildPatientRecordsControllers } from './patient/patientRecordsControllers.js';
import { buildPatientMessagesControllers } from './patient/patientMessagesControllers.js';
import { buildPatientProfileControllers } from './patient/patientProfileControllers.js';
import { buildPatientDiscoveryControllers } from './patient/patientDiscoveryControllers.js';
import { buildAuthControllers } from './auth/authControllers.js';
import { buildDoctorAccessControllers } from './doctor/doctorAccessControllers.js';
import { buildDoctorScheduleControllers } from './doctor/doctorScheduleControllers.js';
import { buildDoctorRecordsControllers } from './doctor/doctorRecordsControllers.js';
import { buildDoctorProfileControllers } from './doctor/doctorProfileControllers.js';
import { buildDoctorMessagesControllers } from './doctor/doctorMessagesControllers.js';
import { buildAdminAccessControllers } from './admin/adminAccessControllers.js';
import { buildAdminUsersControllers } from './admin/adminUsersControllers.js';
import { buildAdminSchedulingControllers } from './admin/adminSchedulingControllers.js';
import { buildAdminBillingControllers } from './admin/adminBillingControllers.js';
import { buildAdminServicesControllers } from './admin/adminServicesControllers.js';
import { buildAdminSystemControllers } from './admin/adminSystemControllers.js';
import { buildAdminReportsControllers } from './admin/adminReportsControllers.js';
import { buildAdminAuditControllers } from './admin/adminAuditControllers.js';
import { buildGuestControllers } from './guestControllers.js';
import { buildAuthMiddleware } from './middleware/auth.js';

// Factory to wire all controllers into an Express router.
export function createHttpRouter(deps) {
  const router = express.Router();

  // Attach auth middleware; req.user is filled when Authorization header is provided.
  const { authenticate, requireRole } = buildAuthMiddleware(deps._repos ? { userRepository: deps._repos.userRepository } : {});
  router.use(authenticate);

  const patientAppointments = buildPatientAppointmentsControllers(deps);
  const patientBilling = buildPatientBillingControllers(deps);
  const patientRecords = buildPatientRecordsControllers(deps);
  const patientMessages = buildPatientMessagesControllers(deps);
  const patientProfile = buildPatientProfileControllers(deps);
  const patientDiscovery = buildPatientDiscoveryControllers(deps);
  const auth = buildAuthControllers(deps);
  const doctorAccess = buildDoctorAccessControllers(deps);
  const doctorSchedule = buildDoctorScheduleControllers(deps);
  const doctorRecords = buildDoctorRecordsControllers(deps);
  const doctorProfile = buildDoctorProfileControllers(deps);
  const doctorMessages = buildDoctorMessagesControllers(deps);
  const guests = buildGuestControllers(deps);

  // Admin controllers by bounded concern
  const adminAccess = buildAdminAccessControllers(deps);
  const adminUsers = buildAdminUsersControllers(deps);
  const adminScheduling = buildAdminSchedulingControllers(deps);
  const adminBilling = buildAdminBillingControllers(deps);
  const adminServices = buildAdminServicesControllers(deps);
  const adminSystem = buildAdminSystemControllers(deps);
  const adminReports = buildAdminReportsControllers(deps);
  const adminAudit = buildAdminAuditControllers(deps);

  // Auth
  router.post('/auth/login', auth.login);
  router.post('/auth/logout', auth.logout);
  router.post('/auth/reset-password', auth.resetPassword);

  // Patients (registration and doctor search remain public; others require patient role)
  router.post('/patients/register', patientProfile.registerPatientAccount);
  router.get('/patients/doctors/search', patientDiscovery.searchDoctors);

  router.post('/patients/appointments', requireRole(['patient']), patientAppointments.scheduleAppointment);
  router.put('/patients/appointments/:id', requireRole(['patient']), patientAppointments.rescheduleAppointment);
  router.delete('/patients/appointments/:id', requireRole(['patient']), patientAppointments.cancelAppointment);
  router.get('/patients/appointments', requireRole(['patient']), patientAppointments.viewAppointments);
  router.get('/patients/billing', requireRole(['patient']), patientBilling.viewBillingAndPayments);
  router.get('/patients/medical-records', requireRole(['patient']), patientRecords.viewMedicalRecords);
  router.get('/patients/prescriptions/:id/download', requireRole(['patient']), patientRecords.downloadPrescription);
  router.post('/patients/messages', requireRole(['patient']), patientMessages.sendPatientMessage);
  router.put('/patients/profile', requireRole(['patient']), patientProfile.updatePatientProfile);

  // Guests
  router.get('/guests/public-info', guests.browsePublicInfo);
  router.get('/guests/services/:serviceId', guests.viewPublicServiceDetail);
  router.get('/guests/doctors/search', guests.guestSearchDoctors);
  router.post('/guests/registration', guests.startRegistration);
  router.post('/guests/contact', guests.submitContactForm);
  router.get('/guests/doctors/:doctorId/available-slots', guests.viewAvailableSlots);

  // Doctor access
  router.post('/doctors/login', doctorAccess.doctorLogin);

  // Doctor schedule & appointments
  router.get('/doctors/schedule', requireRole(['doctor']), doctorSchedule.viewSchedule);
  router.post('/doctors/appointments/:appointmentId/decision', requireRole(['doctor']), doctorSchedule.decideAppointment);
  router.post('/doctors/appointments/:appointmentId/status', requireRole(['doctor']), doctorSchedule.markAppointmentStatus);

  // Doctor records
  router.get('/doctors/patients/:patientId/chart', requireRole(['doctor']), doctorRecords.accessPatientChart);
  router.post('/doctors/patients/:patientId/visit-notes', requireRole(['doctor']), doctorRecords.addVisitNote);
  router.post('/doctors/records/:recordId/entries', requireRole(['doctor']), doctorRecords.updateMedicalRecordEntry);
  router.post('/doctors/lab-results/:labResultId/review', requireRole(['doctor']), doctorRecords.reviewTestResults);

  // Doctor profile
  router.put('/doctors/profile', requireRole(['doctor']), doctorProfile.updateProfile);

  // Doctor messages
  router.post('/doctors/messages', requireRole(['doctor']), doctorMessages.sendMessage);

  // Admin access
  router.post('/admin/login', adminAccess.adminLogin);

  // Admin users & roles
  router.post('/admin/users/:userId/roles', requireRole(['admin']), adminUsers.assignRoles);
  router.patch('/admin/users/:userId/status', requireRole(['admin']), adminUsers.manageUserStatus);

  // Admin doctor scheduling and appointment overrides
  router.put('/admin/doctors/:doctorId/schedule', requireRole(['admin']), adminScheduling.setDoctorSlots);
  router.post('/admin/appointments/:appointmentId/override', requireRole(['admin']), adminScheduling.overrideAppointment);

  // Admin billing
  router.post('/admin/billing/:invoiceId/action', requireRole(['admin']), adminBilling.manageBilling);

  // Admin services/catalog
  router.post('/admin/services', requireRole(['admin']), adminServices.upsertService);
  router.delete('/admin/services/:serviceId', requireRole(['admin']), adminServices.removeService);

  // Admin system settings
  router.put('/admin/settings', requireRole(['admin']), adminSystem.updateSettings);

  // Admin reports
  router.get('/admin/reports', requireRole(['admin']), adminReports.runReport);

  // Admin audits
  router.post('/admin/medical-records/:recordId/audit', requireRole(['admin']), adminAudit.auditRecord);

  return router;
}
