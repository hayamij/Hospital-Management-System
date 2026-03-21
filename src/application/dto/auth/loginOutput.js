export class LoginOutput {
	constructor({ userId, role, accessToken, refreshToken, expiresAt }) {
		this.userId = userId;
		this.role = role;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
	}
}
