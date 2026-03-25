export class AssignRolesInput {
	constructor({ adminId, userId, role }) {
		this.adminId = adminId;
		this.userId = userId;
		this.role = role;
	}
}
