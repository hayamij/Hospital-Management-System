export class LoginOutput {
	constructor({ userId, patientId, role, accessToken, refreshToken, expiresAt }) {
		this.userId = userId;
		this.patientId = patientId;
		this.role = role;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
	}
}
