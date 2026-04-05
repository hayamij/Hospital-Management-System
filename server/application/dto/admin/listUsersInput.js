export class ListUsersInput {
  constructor({ adminId, query, role, type, page, pageSize }) {
    this.adminId = adminId;
    this.query = query;
    this.role = role;
    this.type = type;
    this.page = page;
    this.pageSize = pageSize;
  }
}
