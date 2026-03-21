// Port for system settings persistence.
export class SettingsRepositoryPort {
	async getSettings() {
		throw new Error('SettingsRepositoryPort.getSettings not implemented');
	}

	async save(settings) {
		throw new Error('SettingsRepositoryPort.save not implemented');
	}
}
