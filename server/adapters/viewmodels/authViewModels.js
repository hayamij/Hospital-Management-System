export class LoginViewModel {
  constructor(output) {
    this.userId = output.userId;
    this.token = output.token ?? output.accessToken;
    this.role = output.role;
    this.refreshToken = output.refreshToken;
    this.expiresAt = output.expiresAt;
  }
}

export class RegisterViewModel {
  constructor(output) {
    this.userId = output.userId;
    this.status = output.status;
  }
}

export class ChangePasswordViewModel {
  constructor(output) {
    this.userId = output.userId;
    this.changedAt = output.changedAt;
  }
}

export class LogoutViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}

export class ResetPasswordViewModel {
  constructor(output) {
    Object.assign(this, output);
  }
}
