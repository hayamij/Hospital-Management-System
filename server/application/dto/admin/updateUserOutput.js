export class UpdateUserOutput {
  constructor({ userId, fullName, email, role, status, updatedAt }) {
    this.userId = userId;
    this.fullName = fullName;
    this.email = email;
    this.role = role;
    this.status = status;
    this.updatedAt = updatedAt;
  }
}
