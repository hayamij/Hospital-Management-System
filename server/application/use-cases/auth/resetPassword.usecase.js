import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ResetPasswordInput } from '../../dto/auth/resetPasswordInput.js';
import { ResetPasswordOutput } from '../../dto/auth/resetPasswordOutput.js';

export class ResetPasswordUseCase {
	constructor({ userRepository, authService }) {
		this.userRepository = userRepository;
		this.authService = authService;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ResetPasswordInput ? inputDto : new ResetPasswordInput(inputDto);

		if (!input.email || !String(input.email).trim()) {
			throw new DomainError('Email is required.');
		}
		if (!input.oldPassword || !String(input.oldPassword)) {
			throw new DomainError('Old password is required.');
		}
		if (!input.newPassword || !String(input.newPassword)) {
			throw new DomainError('New password is required.');
		}
		if (String(input.newPassword).length < 8) {
			throw new DomainError('New password must be at least 8 characters.');
		}

		const user = await this.userRepository.findByEmail(input.email.trim());
		if (!user) {
			throw new DomainError('User not found.');
		}

		const passwordOk = await this.authService.comparePassword(input.oldPassword, user.passwordHash);
		if (!passwordOk) {
			throw new DomainError('Invalid credentials.');
		}

		const newHash = await this.authService.hashPassword(input.newPassword);
		user.passwordHash = newHash;
		if (typeof user.touch === 'function') {
			user.touch();
		} else {
			user.updatedAt = new Date();
		}

		await this.userRepository.save(user);

		return new ResetPasswordOutput({ success: true });
	}
}
