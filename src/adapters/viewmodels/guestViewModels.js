export class BrowsePublicInfoViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}

export class GuestSearchDoctorsViewModel {
  constructor(output) {
    this.page = output?.page;
    this.pageSize = output?.pageSize;
    this.total = output?.total;
    this.doctors = output?.doctors;
  }
}

export class StartRegistrationViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}

export class SubmitContactFormViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}

export class ViewAvailableSlotsViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}
