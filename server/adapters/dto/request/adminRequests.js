export class CreateDoctorRequest {
  constructor(body) { Object.assign(this, body); }
}

export class UpdateDoctorRequest {
  constructor(params, body) { this.id = params.id; Object.assign(this, body); }
}

export class AssignRolesRequest {
  constructor(params, body) { this.userId = params.id; this.roles = body.roles; }
}

export class CreateServiceCatalogItemRequest {
  constructor(body) { Object.assign(this, body); }
}

export class UpdateServiceCatalogItemRequest {
  constructor(params, body) { this.id = params.id; Object.assign(this, body); }
}

export class GenerateReportRequest {
  constructor(query) { this.type = query.type; this.from = query.from; this.to = query.to; }
}
