export class DoctorLoginOutput {
	constructor({ doctorId, role, accessToken, refreshToken, expiresAt }) {
		this.doctorId = doctorId;
		this.role = role;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
	}
}
