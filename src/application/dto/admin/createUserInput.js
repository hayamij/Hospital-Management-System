export class CreateUserInput {
  constructor({ adminId, fullName, email, role, status, password }) {
    this.adminId = adminId;
    this.fullName = fullName;
    this.email = email;
    this.role = role;
    this.status = status;
    this.password = password;
  }
}
