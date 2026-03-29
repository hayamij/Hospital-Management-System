export class ListUsersInput {
  constructor({ adminId, query, type, page, pageSize }) {
    this.adminId = adminId;
    this.query = query;
    this.type = type;
    this.page = page;
    this.pageSize = pageSize;
  }
}
