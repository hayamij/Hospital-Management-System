export class ManageUsersInput {
	constructor({ adminId, userId, action }) {
		this.adminId = adminId;
		this.userId = userId;
		this.action = action; // 'verify' | 'disable' | 'enable'
	}
}
