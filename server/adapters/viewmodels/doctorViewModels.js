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

export class CreateMedicalRecordViewModel {
  constructor(output) {
    this.recordId = output.recordId;
    this.patientId = output.patientId;
    this.created = output.created;
    this.createdAt = output.createdAt;
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
    const records = Array.isArray(output?.records)
      ? output.records
      : Array.isArray(output?.entries)
        ? output.entries
        : [];

    this.page = output?.page ?? 1;
    this.pageSize = output?.pageSize ?? records.length;
    this.total = output?.total ?? records.length;
    this.records = records;
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
