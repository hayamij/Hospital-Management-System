export class AdminLoginOutput {
	constructor({ adminId, role, accessToken, refreshToken, expiresAt }) {
		this.adminId = adminId;
		this.role = role;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
	}
}
