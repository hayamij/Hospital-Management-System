import { DomainError } from '../../../domain/exceptions/domainError.js';
import { LoginInput } from '../../dto/auth/loginInput.js';
import { LoginOutput } from '../../dto/auth/loginOutput.js';
import { isValidEmail, normalizeEmail } from '../../utils/email.js';

export class LoginUseCase {
	constructor({ userRepository, authService }) {
		this.userRepository = userRepository;
		this.authService = authService;
	}

	async execute(inputDto) {
		const input = inputDto instanceof LoginInput ? inputDto : new LoginInput(inputDto);
		const email = normalizeEmail(input.email);

		if (!email) {
			throw new DomainError('Email is required.');
		}
		if (!isValidEmail(email)) {
			throw new DomainError('Email format is invalid. Expected format: name@abc.xyz.');
		}
		if (!input.password || !String(input.password)) {
			throw new DomainError('Password is required.');
		}

		const user = await this.userRepository.findByEmail(email);
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
			patientId: user.patientId ?? null,
			doctorId: user.doctorId ?? null,
			role,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
		});
	}
}
