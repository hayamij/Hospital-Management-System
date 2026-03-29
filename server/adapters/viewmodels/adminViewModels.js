export class CreateDoctorViewModel {
  constructor(output) {
    this.doctorId = output.doctorId;
    this.status = output.status;
  }
}

export class UpdateDoctorViewModel {
  constructor(output) {
    this.doctorId = output.doctorId;
    this.status = output.status;
  }
}

export class AssignRolesViewModel {
  constructor(output) {
    this.userId = output.userId;
    this.roles = output.roles;
  }
}

export class ListUsersViewModel {
  constructor(output) {
    this.page = output.page;
    this.pageSize = output.pageSize;
    this.total = output.total;
    this.users = output.users;
  }
}

export class CreateUserViewModel {
  constructor(output) {
    this.userId = output.userId;
    this.fullName = output.fullName;
    this.email = output.email;
    this.role = output.role;
    this.status = output.status;
    this.createdAt = output.createdAt;
  }
}

export class UpdateUserViewModel {
  constructor(output) {
    this.userId = output.userId;
    this.fullName = output.fullName;
    this.email = output.email;
    this.role = output.role;
    this.status = output.status;
    this.updatedAt = output.updatedAt;
  }
}

export class CreateServiceCatalogItemViewModel {
  constructor(output) {
    this.itemId = output.itemId;
    this.status = output.status;
  }
}

export class UpdateServiceCatalogItemViewModel {
  constructor(output) {
    this.itemId = output.itemId;
    this.status = output.status;
  }
}

export class GenerateReportViewModel {
  constructor(output) {
    this.reportId = output.reportId;
    this.url = output.url;
    this.generatedAt = output.generatedAt;
  }
}

export class ManageBillingViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}

export class UpdateSystemSettingsViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}

export class AuditRecordViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}
