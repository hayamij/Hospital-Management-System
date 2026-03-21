import { BrowsePublicInfoInput } from '../../dto/guest/browsePublicInfoInput.js';
import { BrowsePublicInfoOutput } from '../../dto/guest/browsePublicInfoOutput.js';

export class BrowsePublicInfoUseCase {
	constructor({ serviceCatalogRepository, settingsRepository }) {
		this.serviceCatalogRepository = serviceCatalogRepository;
		this.settingsRepository = settingsRepository;
	}

	async execute(inputDto = {}) {
		const input = inputDto instanceof BrowsePublicInfoInput ? inputDto : new BrowsePublicInfoInput(inputDto);
		void input;

		const services = await this.serviceCatalogRepository.listServices();
		const hospitalInfo = await this.settingsRepository.getSettings();

		return new BrowsePublicInfoOutput({ services: services ?? [], hospitalInfo: hospitalInfo ?? {} });
	}
}
