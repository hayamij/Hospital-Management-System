import { DomainError } from '../../../domain/exceptions/domainError.js';
import { DoctorLoginInput } from '../../dto/doctor/doctorLoginInput.js';
import { DoctorLoginOutput } from '../../dto/doctor/doctorLoginOutput.js';

export class DoctorLoginUseCase {
	constructor({ userRepository, authService }) {
		this.userRepository = userRepository;
		this.authService = authService;
	}

	async execute(inputDto) {
		const input = inputDto instanceof DoctorLoginInput ? inputDto : new DoctorLoginInput(inputDto);

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

		const role = user.role ?? (Array.isArray(user.roles) ? user.roles.find((r) => r === 'doctor') : undefined);
		if (!role || role !== 'doctor') {
			throw new DomainError('Access denied. Doctor role required.');
		}

		if (user.status === 'disabled' || user.status === 'inactive') {
			throw new DomainError('Account is disabled.');
		}

		const passwordOk = await this.authService.comparePassword(input.password, user.passwordHash);
		if (!passwordOk) {
			throw new DomainError('Invalid credentials.');
		}

		const tokens = await this.authService.generateTokens({ userId: user.id, role });

		return new DoctorLoginOutput({
			doctorId: user.id,
			role,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
		});
	}
}
