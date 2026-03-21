export class ScheduleAppointmentRequest {
  constructor(body, user) {
    this.patientId = user?.id ?? body.patientId;
    this.doctorId = body.doctorId;
    this.startAt = body.startAt;
    this.endAt = body.endAt;
    this.reason = body.reason;
  }
}

export class RescheduleAppointmentRequest {
  constructor(body, user) {
    this.patientId = user?.id ?? body.patientId;
    this.appointmentId = body.appointmentId;
    this.startAt = body.startAt;
    this.endAt = body.endAt;
  }
}

export class CancelAppointmentRequest {
  constructor(params, user, body) {
    this.patientId = user?.id ?? body?.patientId;
    this.appointmentId = params.id;
  }
}

export class SearchDoctorsRequest {
  constructor(query) {
    this.query = query.q;
    this.specialty = query.specialty;
    this.page = query.page;
    this.pageSize = query.pageSize;
  }
}

export class RegisterPatientAccountRequest {
  constructor(body) {
    Object.assign(this, body);
  }
}

export class UpdatePatientProfileRequest {
  constructor(body, user) {
    this.patientId = user?.id ?? body.patientId;
    Object.assign(this, body);
  }
}

export class ViewAppointmentsRequest {
  constructor(query, user) {
    this.patientId = user?.id ?? query.patientId;
    this.status = query.status;
    this.page = query.page;
    this.pageSize = query.pageSize;
  }
}

export class ViewBillingAndPaymentsRequest {
  constructor(query, user) {
    this.patientId = user?.id ?? query.patientId;
    this.status = query.status;
    this.page = query.page;
    this.pageSize = query.pageSize;
  }
}

export class ViewMedicalRecordsRequest {
  constructor(query, user) {
    this.patientId = user?.id ?? query.patientId;
    this.page = query.page;
    this.pageSize = query.pageSize;
  }
}

export class DownloadPrescriptionRequest {
  constructor(params, query, user) {
    this.prescriptionId = params.id;
    this.patientId = user?.id ?? query.patientId;
  }
}

export class SendPatientMessageRequest {
  constructor(body, user) {
    this.patientId = user?.id ?? body.patientId;
    this.doctorId = body.doctorId;
    this.subject = body.subject;
    this.message = body.message;
  }
}
