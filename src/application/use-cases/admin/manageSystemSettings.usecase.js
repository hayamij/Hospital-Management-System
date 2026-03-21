import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ManageSystemSettingsInput } from '../../dto/admin/manageSystemSettingsInput.js';
import { ManageSystemSettingsOutput } from '../../dto/admin/manageSystemSettingsOutput.js';

export class ManageSystemSettingsUseCase {
	constructor({ settingsRepository, userRepository }) {
		this.settingsRepository = settingsRepository;
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ManageSystemSettingsInput ? inputDto : new ManageSystemSettingsInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.settings || typeof input.settings !== 'object') {
			throw new DomainError('Settings payload is required.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		const hasAdminRole = adminUser?.role === 'admin' || Array.isArray(adminUser?.roles) && adminUser.roles.includes('admin');
		if (!adminUser || !hasAdminRole) {
			throw new DomainError('Access denied. Admin role required.');
		}

		const currentSettings = await this.settingsRepository.getSettings();
		const updatedSettings = { ...(currentSettings ?? {}), ...input.settings };

		await this.settingsRepository.save(updatedSettings);

		return new ManageSystemSettingsOutput({ success: true, updatedSettings, error: null });
	}
}
