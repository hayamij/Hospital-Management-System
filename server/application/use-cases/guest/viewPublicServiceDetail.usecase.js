import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ServiceCatalogItem } from '../../../domain/entities/serviceCatalogItem.js';
import { ViewPublicServiceDetailInput } from '../../dto/guest/viewPublicServiceDetailInput.js';
import { ViewPublicServiceDetailOutput } from '../../dto/guest/viewPublicServiceDetailOutput.js';

export class ViewPublicServiceDetailUseCase {
  constructor({ serviceCatalogRepository }) {
    this.serviceCatalogRepository = serviceCatalogRepository;
  }

  async execute(inputDto) {
    const input = inputDto instanceof ViewPublicServiceDetailInput
      ? inputDto
      : new ViewPublicServiceDetailInput(inputDto ?? {});

    if (!input.serviceId || typeof input.serviceId !== 'string') {
      throw new DomainError('serviceId is required.');
    }

    const service = await this.serviceCatalogRepository.findServiceById(input.serviceId);
    if (!service) {
      return new ViewPublicServiceDetailOutput({ service: null });
    }

    const entity = new ServiceCatalogItem({
      id: service.id,
      name: service.name,
      price: Number(service.price ?? 0),
      description: service.description ?? '',
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    });

    return new ViewPublicServiceDetailOutput({
      service: {
        id: entity.id,
        name: entity.name,
        price: entity.price,
        description: entity.description,
      },
    });
  }
}