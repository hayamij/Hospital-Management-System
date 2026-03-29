export class ViewDoctorAppointmentsViewModel {
  constructor(output) {
    this.page = output.page;
    this.pageSize = output.pageSize;
    this.total = output.total;
    this.appointments = output.appointments;
  }
}

export class UpdateAppointmentStatusViewModel {
  constructor(output) {
    this.appointmentId = output.appointmentId;
    this.status = output.status;
    this.updatedAt = output.updatedAt;
  }
}

export class AddMedicalRecordEntryViewModel {
  constructor(output) {
    this.recordId = output.recordId;
    this.entryId = output.entryId;
    this.addedAt = output.addedAt;
  }
}

export class SendDoctorMessageViewModel {
  constructor(output) {
    this.messageId = output.messageId;
    this.status = output.status;
    this.sentAt = output.sentAt;
  }
}

export class ViewPatientRecordsForDoctorViewModel {
  constructor(output) {
    this.page = output.page;
    this.pageSize = output.pageSize;
    this.total = output.total;
    this.records = output.records;
  }
}

export class UpdateDoctorProfileViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}

export class DoctorLoginViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}
