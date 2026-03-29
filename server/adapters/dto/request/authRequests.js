export class LoginRequest {
  constructor(body) { Object.assign(this, body); }
}

export class RegisterRequest {
  constructor(body) { Object.assign(this, body); }
}

export class ChangePasswordRequest {
  constructor(body, user) { this.userId = user?.id ?? body.userId; Object.assign(this, body); }
}
