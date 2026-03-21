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

// Factory to wire all controllers into an Express router.
export function createHttpRouter(deps) {
  const router = express.Router();

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

  // Patients
  router.post('/patients/appointments', patientAppointments.scheduleAppointment);
  router.put('/patients/appointments/:id', patientAppointments.rescheduleAppointment);
  router.delete('/patients/appointments/:id', patientAppointments.cancelAppointment);
  router.get('/patients/appointments', patientAppointments.viewAppointments);
  router.get('/patients/billing', patientBilling.viewBillingAndPayments);
  router.get('/patients/medical-records', patientRecords.viewMedicalRecords);
  router.get('/patients/prescriptions/:id/download', patientRecords.downloadPrescription);
  router.get('/patients/doctors/search', patientDiscovery.searchDoctors);
  router.post('/patients/messages', patientMessages.sendPatientMessage);
  router.post('/patients/register', patientProfile.registerPatientAccount);
  router.put('/patients/profile', patientProfile.updatePatientProfile);

  // Guests
  router.get('/guests/public-info', guests.browsePublicInfo);
  router.get('/guests/doctors/search', guests.guestSearchDoctors);
  router.post('/guests/registration', guests.startRegistration);
  router.post('/guests/contact', guests.submitContactForm);
  router.get('/guests/doctors/:doctorId/available-slots', guests.viewAvailableSlots);

  // Doctor access
  router.post('/doctors/login', doctorAccess.doctorLogin);

  // Doctor schedule & appointments
  router.get('/doctors/schedule', doctorSchedule.viewSchedule);
  router.post('/doctors/appointments/:appointmentId/decision', doctorSchedule.decideAppointment);
  router.post('/doctors/appointments/:appointmentId/status', doctorSchedule.markAppointmentStatus);

  // Doctor records
  router.get('/doctors/patients/:patientId/chart', doctorRecords.accessPatientChart);
  router.post('/doctors/patients/:patientId/visit-notes', doctorRecords.addVisitNote);
  router.post('/doctors/records/:recordId/entries', doctorRecords.updateMedicalRecordEntry);
  router.post('/doctors/lab-results/:labResultId/review', doctorRecords.reviewTestResults);

  // Doctor profile
  router.put('/doctors/profile', doctorProfile.updateProfile);

  // Doctor messages
  router.post('/doctors/messages', doctorMessages.sendMessage);

  // Admin access
  router.post('/admin/login', adminAccess.adminLogin);

  // Admin users & roles
  router.post('/admin/users/:userId/roles', adminUsers.assignRoles);
  router.patch('/admin/users/:userId/status', adminUsers.manageUserStatus);

  // Admin doctor scheduling and appointment overrides
  router.put('/admin/doctors/:doctorId/schedule', adminScheduling.setDoctorSlots);
  router.post('/admin/appointments/:appointmentId/override', adminScheduling.overrideAppointment);

  // Admin billing
  router.post('/admin/billing/:invoiceId/action', adminBilling.manageBilling);

  // Admin services/catalog
  router.post('/admin/services', adminServices.upsertService);
  router.delete('/admin/services/:serviceId', adminServices.removeService);

  // Admin system settings
  router.put('/admin/settings', adminSystem.updateSettings);

  // Admin reports
  router.get('/admin/reports', adminReports.runReport);

  // Admin audits
  router.post('/admin/medical-records/:recordId/audit', adminAudit.auditRecord);

  return router;
}
