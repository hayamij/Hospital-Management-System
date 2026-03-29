export class ListUsersOutput {
  constructor({ page, pageSize, total, users }) {
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.users = users;
  }
}
