import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ManageUsersInput } from '../../dto/admin/manageUsersInput.js';
import { ManageUsersOutput } from '../../dto/admin/manageUsersOutput.js';

export class ManageUsersUseCase {
	constructor({ userRepository }) {
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ManageUsersInput ? inputDto : new ManageUsersInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.userId) {
			throw new DomainError('User id is required.');
		}

		const allowedActions = new Set(['verify', 'disable', 'enable']);
		if (!allowedActions.has(input.action)) {
			throw new DomainError('Invalid manage users action.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		const hasAdminRole = adminUser?.role === 'admin' || Array.isArray(adminUser?.roles) && adminUser.roles.includes('admin');
		if (!adminUser || !hasAdminRole) {
			throw new DomainError('Access denied. Admin role required.');
		}

		const user = await this.userRepository.findById(input.userId);
		if (!user) {
			throw new DomainError('User not found.');
		}

		const applyStatus = (status) => {
			if (typeof user.setStatus === 'function') {
				user.setStatus(status);
				return;
			}
			if (status === 'active' && typeof user.activate === 'function') {
				user.activate();
				return;
			}
			if (status === 'disabled' && typeof user.deactivate === 'function') {
				user.deactivate();
				return;
			}

			user.status = status;
			if (typeof user.touch === 'function') {
				user.touch();
			} else {
				user.updatedAt = new Date();
			}
		};

		let resultingStatus = 'pending';
		switch (input.action) {
			case 'verify':
				resultingStatus = 'verified';
				applyStatus(resultingStatus);
				break;
			case 'disable':
				resultingStatus = 'disabled';
				applyStatus(resultingStatus);
				break;
			case 'enable':
				resultingStatus = 'active';
				applyStatus(resultingStatus);
				break;
			default:
				throw new DomainError('Unsupported manage users action.');
		}

		if (typeof this.userRepository.save === 'function') {
			await this.userRepository.save(user);
		}

		const resolvedUserId = user.id ?? user.getId?.() ?? input.userId;
		return new ManageUsersOutput({ userId: resolvedUserId, status: resultingStatus });
	}
}
