export class ViewDoctorAppointmentsRequest {
  constructor(query, user) {
    this.doctorId = user?.id ?? query.doctorId;
    this.status = query.status;
    this.from = query.from;
    this.to = query.to;
    this.page = query.page;
    this.pageSize = query.pageSize;
  }
}

export class UpdateAppointmentStatusRequest {
  constructor(params, body, user) {
    this.doctorId = user?.id ?? body.doctorId;
    this.appointmentId = params.id;
    this.status = body.status;
  }
}

export class AddMedicalRecordEntryRequest {
  constructor(body, user) {
    this.doctorId = user?.id ?? body.doctorId;
    this.patientId = body.patientId;
    this.note = body.note;
    this.attachments = body.attachments;
  }
}

export class SendDoctorMessageRequest {
  constructor(body, user) {
    this.doctorId = user?.id ?? body.doctorId;
    this.patientId = body.patientId;
    this.subject = body.subject;
    this.message = body.message;
  }
}

export class ViewPatientRecordsForDoctorRequest {
  constructor(params, query, user) {
    this.doctorId = user?.id ?? query.doctorId;
    this.patientId = params.patientId;
    this.page = query.page;
    this.pageSize = query.pageSize;
  }
}
