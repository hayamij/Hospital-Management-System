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

		const action = String(input.action).trim().toLowerCase();

		const allowedActions = new Set(['upsert', 'remove', 'list']);
		if (!allowedActions.has(action)) {
			throw new DomainError('Invalid service catalog action.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		const hasAdminRole = adminUser?.role === 'admin' || Array.isArray(adminUser?.roles) && adminUser.roles.includes('admin');
		if (!adminUser || !hasAdminRole) {
			throw new DomainError('Access denied. Admin role required.');
		}

		if (action === 'list') {
			const pageInput = input.page;
			const pageSizeInput = input.pageSize;
			const page = pageInput === undefined || pageInput === null || pageInput === '' ? 1 : Number(pageInput);
			const pageSize = pageSizeInput === undefined || pageSizeInput === null || pageSizeInput === '' ? 10 : Number(pageSizeInput);

			if (!Number.isFinite(page) || !Number.isFinite(pageSize) || page <= 0 || pageSize <= 0) {
				throw new DomainError('Invalid pagination parameters.');
			}

			const query = String(input.query || '').trim().toLowerCase();
			const allServices = await this.serviceCatalogRepository.listServices();
			const filteredServices = query
				? allServices.filter((service) => {
					const haystack = `${service?.id || ''} ${service?.name || ''}`.toLowerCase();
					return haystack.includes(query);
				})
				: allServices;

			const safePage = Math.floor(page);
			const safePageSize = Math.floor(pageSize);
			const offset = (safePage - 1) * safePageSize;

			return new ConfigureServicesAndPricingOutput({
				action: 'list',
				services: filteredServices.slice(offset, offset + safePageSize),
				page: safePage,
				pageSize: safePageSize,
				total: filteredServices.length,
			});
		}

		if (action === 'remove') {
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
