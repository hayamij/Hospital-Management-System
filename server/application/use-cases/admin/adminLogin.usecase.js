import { DomainError } from '../../../domain/exceptions/domainError.js';
import { AdminLoginInput } from '../../dto/admin/adminLoginInput.js';
import { AdminLoginOutput } from '../../dto/admin/adminLoginOutput.js';

export class AdminLoginUseCase {
	constructor({ userRepository, authService }) {
		this.userRepository = userRepository;
		this.authService = authService;
	}

	async execute(inputDto) {
		const input = inputDto instanceof AdminLoginInput ? inputDto : new AdminLoginInput(inputDto);

		if (!input.email || !String(input.email).trim()) {
			throw new DomainError('Email is required.');
		}
		if (!input.password || !String(input.password)) {
			throw new DomainError('Password is required.');
		}

		const user = await this.userRepository.findByEmail(input.email.trim());
		if (!user) {
			throw new DomainError('Invalid credentials.');
		}
		if (!user.role || user.role !== 'admin') {
			throw new DomainError('Access denied. Admin role required.');
		}

		const passwordOk = await this.authService.comparePassword(input.password, user.passwordHash);
		if (!passwordOk) {
			throw new DomainError('Invalid credentials.');
		}

		const tokens = await this.authService.generateTokens({ userId: user.id, role: user.role });

		return new AdminLoginOutput({
			adminId: user.id,
			role: user.role,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
		});
	}
}
