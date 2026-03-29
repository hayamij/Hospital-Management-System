export class UpdateUserInput {
  constructor({ adminId, userId, fullName, email, role, status }) {
    this.adminId = adminId;
    this.userId = userId;
    this.fullName = fullName;
    this.email = email;
    this.role = role;
    this.status = status;
  }
}
