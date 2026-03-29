import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ConfigureServicesAndPricingInput } from '../../dto/admin/configureServicesAndPricingInput.js';
import { ConfigureServicesAndPricingOutput } from '../../dto/admin/configureServicesAndPricingOutput.js';

export class ConfigureServicesAndPricingUseCase {
	constructor({ serviceCatalogRepository, userRepository }) {
		this.serviceCatalogRepository = serviceCatalogRepository;
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ConfigureServicesAndPricingInput ? inputDto : new ConfigureServicesAndPricingInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.action || !String(input.action).trim()) {
			throw new DomainError('Action is required.');
		}

		const allowedActions = new Set(['upsert', 'remove']);
		if (!allowedActions.has(input.action)) {
			throw new DomainError('Invalid service catalog action.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		const hasAdminRole = adminUser?.role === 'admin' || Array.isArray(adminUser?.roles) && adminUser.roles.includes('admin');
		if (!adminUser || !hasAdminRole) {
			throw new DomainError('Access denied. Admin role required.');
		}

		if (input.action === 'remove') {
			if (!input.service?.id) {
				throw new DomainError('Service id is required to remove.');
			}
			await this.serviceCatalogRepository.removeService(input.service.id);
			return new ConfigureServicesAndPricingOutput({ serviceId: input.service.id, action: 'remove' });
		}

		const service = input.service ?? {};
		if (!service.name || !String(service.name).trim()) {
			throw new DomainError('Service name is required to upsert.');
		}
		if (service.price === undefined || service.price === null || Number.isNaN(Number(service.price)) || Number(service.price) < 0) {
			throw new DomainError('Service price must be a non-negative number.');
		}

		const normalizedService = {
			id: service.id,
			name: String(service.name).trim(),
			price: Number(service.price),
		};

		await this.serviceCatalogRepository.upsertService(normalizedService);
		return new ConfigureServicesAndPricingOutput({ serviceId: normalizedService.id, action: 'upsert' });
	}
}
