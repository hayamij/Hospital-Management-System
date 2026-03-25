export class LogoutInput {
	constructor({ userId, refreshToken, accessToken }) {
		this.userId = userId;
		this.refreshToken = refreshToken;
		this.accessToken = accessToken;
	}
}
