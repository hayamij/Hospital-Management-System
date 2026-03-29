export class ManageSystemSettingsOutput {
	constructor({ success, updatedSettings, error }) {
		this.success = success;
		this.updatedSettings = updatedSettings;
		this.error = error;
	}
}
