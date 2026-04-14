export class LoginOutput {
	constructor({ userId, patientId, doctorId, role, accessToken, refreshToken, expiresAt }) {
		this.userId = userId;
		this.patientId = patientId;
		this.doctorId = doctorId;
		this.role = role;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
	}
}
