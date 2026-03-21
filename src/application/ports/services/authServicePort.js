// Port for auth-related services (hash verification, token issuing).
export class AuthServicePort {
	async comparePassword(plain, hashed) {
		throw new Error('AuthServicePort.comparePassword not implemented');
	}

	async generateTokens({ userId, role }) {
		throw new Error('AuthServicePort.generateTokens not implemented');
	}

	async revokeTokens({ userId, refreshToken, accessToken }) {
		throw new Error('AuthServicePort.revokeTokens not implemented');
	}

	async hashPassword(plain) {
		throw new Error('AuthServicePort.hashPassword not implemented');
	}
}
