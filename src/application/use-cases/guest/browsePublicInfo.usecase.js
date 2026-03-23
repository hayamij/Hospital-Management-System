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
		const insurancePlans =
			typeof this.serviceCatalogRepository.listInsurancePlans === 'function'
				? await this.serviceCatalogRepository.listInsurancePlans()
				: [];
		const bookingConstraints =
			typeof this.serviceCatalogRepository.listBookingConstraints === 'function'
				? await this.serviceCatalogRepository.listBookingConstraints()
				: [];
		const hospitalInfo = await this.settingsRepository.getSettings();

		return new BrowsePublicInfoOutput({
			services: services ?? [],
			insurancePlans: insurancePlans ?? [],
			bookingConstraints: bookingConstraints ?? [],
			hospitalInfo: hospitalInfo ?? {},
		});
	}
}
