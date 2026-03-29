import { DomainError } from '../../../domain/exceptions/domainError.js';
import { LogoutInput } from '../../dto/auth/logoutInput.js';
import { LogoutOutput } from '../../dto/auth/logoutOutput.js';

export class LogoutUseCase {
	constructor({ userRepository, authService }) {
		this.userRepository = userRepository;
		this.authService = authService;
	}

	async execute(inputDto) {
		const input = inputDto instanceof LogoutInput ? inputDto : new LogoutInput(inputDto);

		if (!input.userId) {
			throw new DomainError('User id is required.');
		}
		if (!input.refreshToken && !input.accessToken) {
			throw new DomainError('At least one token is required to logout.');
		}

		const user = await this.userRepository.findById(input.userId);
		if (!user) {
			throw new DomainError('User not found.');
		}

		await this.authService.revokeTokens({
			userId: input.userId,
			refreshToken: input.refreshToken,
			accessToken: input.accessToken,
		});

		return new LogoutOutput({ success: true });
	}
}
