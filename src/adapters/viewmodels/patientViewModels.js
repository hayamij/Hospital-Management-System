export class ScheduleAppointmentViewModel {
  constructor(output) {
    this.appointmentId = output.appointmentId;
    this.status = output.status;
    this.startAt = output.startAt;
    this.endAt = output.endAt;
  }
}

export class RescheduleAppointmentViewModel {
  constructor(output) {
    this.appointmentId = output.appointmentId;
    this.status = output.status;
    this.startAt = output.startAt;
    this.endAt = output.endAt;
  }
}

export class CancelAppointmentViewModel {
  constructor(output) {
    this.appointmentId = output.appointmentId;
    this.status = output.status;
    this.cancelledAt = output.cancelledAt;
  }
}

export class SearchDoctorsViewModel {
  constructor(output) {
    this.page = output.page;
    this.pageSize = output.pageSize;
    this.total = output.total;
    this.doctors = output.doctors;
  }
}

export class RegisterPatientAccountViewModel {
  constructor(output) {
    this.patientId = output.patientId;
    this.userId = output.userId;
    this.status = output.status;
  }
}

export class UpdatePatientProfileViewModel {
  constructor(output) {
    this.patientId = output.patientId;
    this.updatedAt = output.updatedAt;
  }
}

export class ViewAppointmentsViewModel {
  constructor(output) {
    this.page = output.page;
    this.pageSize = output.pageSize;
    this.total = output.total;
    this.appointments = output.appointments;
  }
}

export class ViewBillingAndPaymentsViewModel {
  constructor(output) {
    this.page = output.page;
    this.pageSize = output.pageSize;
    this.total = output.total;
    this.billings = output.billings;
    this.payments = output.payments;
  }
}

export class ViewMedicalRecordsViewModel {
  constructor(output) {
    this.page = output.page;
    this.pageSize = output.pageSize;
    this.total = output.total;
    this.records = output.records;
  }
}

export class DownloadPrescriptionViewModel {
  constructor(output) {
    this.prescriptionId = output.prescriptionId;
    this.file = output.file;
    this.filename = output.filename;
  }
}

export class SendPatientMessageViewModel {
  constructor(output) {
    this.messageId = output.messageId;
    this.status = output.status;
    this.sentAt = output.sentAt;
  }
}
