export class CreateUserOutput {
  constructor({ userId, fullName, email, role, status, createdAt }) {
    this.userId = userId;
    this.fullName = fullName;
    this.email = email;
    this.role = role;
    this.status = status;
    this.createdAt = createdAt;
  }
}
