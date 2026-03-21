import { DomainError } from '../../../domain/exceptions/domainError.js';
import { AssignRolesInput } from '../../dto/admin/assignRolesInput.js';
import { AssignRolesOutput } from '../../dto/admin/assignRolesOutput.js';

export class AssignRolesUseCase {
	constructor({ userRepository }) {
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof AssignRolesInput ? inputDto : new AssignRolesInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.userId) {
			throw new DomainError('User id is required.');
		}
		if (!input.role || !String(input.role).trim()) {
			throw new DomainError('Role is required.');
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

		const roleToAssign = String(input.role).trim();
		if (Array.isArray(user.roles)) {
			user.roles = Array.from(new Set([...user.roles, roleToAssign]));
		} else if (typeof user.setRole === 'function') {
			user.setRole(roleToAssign);
		} else {
			user.role = roleToAssign;
		}

		if (typeof user.touch === 'function') {
			user.touch();
		} else {
			user.updatedAt = new Date();
		}

		if (typeof this.userRepository.save === 'function') {
			await this.userRepository.save(user);
		}

		const resolvedUserId = user.id ?? user.getId?.() ?? input.userId;
		return new AssignRolesOutput({ userId: resolvedUserId, role: roleToAssign });
	}
}
