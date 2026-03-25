import { DomainError } from '../../../domain/exceptions/domainError.js';
import { LoginInput } from '../../dto/auth/loginInput.js';
import { LoginOutput } from '../../dto/auth/loginOutput.js';

export class LoginUseCase {
	constructor({ userRepository, authService }) {
		this.userRepository = userRepository;
		this.authService = authService;
	}

	async execute(inputDto) {
		const input = inputDto instanceof LoginInput ? inputDto : new LoginInput(inputDto);

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

		if (user.status === 'disabled' || user.status === 'inactive') {
			throw new DomainError('Account is disabled.');
		}

		const passwordOk = await this.authService.comparePassword(input.password, user.passwordHash);
		if (!passwordOk) {
			throw new DomainError('Invalid credentials.');
		}

		const role = user.role ?? (Array.isArray(user.roles) ? user.roles[0] : undefined);
		const tokens = await this.authService.generateTokens({ userId: user.id, role });

		return new LoginOutput({
			userId: user.id,
			role,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
		});
	}
}
