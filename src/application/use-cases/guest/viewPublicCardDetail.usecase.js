import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ServiceCatalogItem } from '../../../domain/entities/serviceCatalogItem.js';
import { InsurancePlan } from '../../../domain/entities/insurancePlan.js';
import { BookingConstraint } from '../../../domain/entities/bookingConstraint.js';
import { ViewPublicCardDetailInput } from '../../dto/guest/viewPublicCardDetailInput.js';
import { ViewPublicCardDetailOutput } from '../../dto/guest/viewPublicCardDetailOutput.js';

const ALLOWED_CATEGORIES = ['services', 'insurance-plans', 'booking-constraints', 'doctors'];

export class ViewPublicCardDetailUseCase {
  constructor({ serviceCatalogRepository, doctorRepository }) {
    this.serviceCatalogRepository = serviceCatalogRepository;
    this.doctorRepository = doctorRepository;
  }

  async execute(inputDto) {
    const input = inputDto instanceof ViewPublicCardDetailInput
      ? inputDto
      : new ViewPublicCardDetailInput(inputDto ?? {});

    if (!input.category || !ALLOWED_CATEGORIES.includes(input.category)) {
      throw new DomainError('Invalid category for public card detail.');
    }
    if (!input.itemId || typeof input.itemId !== 'string') {
      throw new DomainError('itemId is required.');
    }

    if (input.category === 'services') {
      const service = await this.serviceCatalogRepository.findServiceById(input.itemId);
      if (!service) return new ViewPublicCardDetailOutput({ category: input.category, item: null });

      const entity = new ServiceCatalogItem({
        id: service.id,
        name: service.name,
        price: Number(service.price ?? 0),
        description: service.description ?? '',
      });

      return new ViewPublicCardDetailOutput({
        category: input.category,
        item: {
          id: entity.id,
          name: entity.name,
          price: entity.price,
          description: entity.description,
        },
      });
    }

    if (input.category === 'insurance-plans') {
      const plan = await this.serviceCatalogRepository.findInsurancePlanById(input.itemId);
      if (!plan) return new ViewPublicCardDetailOutput({ category: input.category, item: null });

      const entity = new InsurancePlan({
        id: plan.id,
        name: plan.planName,
        provider: plan.provider,
        coveragePercent: 0,
      });

      return new ViewPublicCardDetailOutput({
        category: input.category,
        item: {
          id: entity.id,
          provider: entity.provider,
          planName: entity.name,
          coverageSummary: plan.coverageSummary,
          copayAmount: plan.copayAmount,
        },
      });
    }

    if (input.category === 'booking-constraints') {
      const constraint = await this.serviceCatalogRepository.findBookingConstraintById(input.itemId);
      if (!constraint) return new ViewPublicCardDetailOutput({ category: input.category, item: null });

      const entity = new BookingConstraint({
        id: constraint.id,
        code: constraint.code,
        description: constraint.description,
        value: constraint.value,
      });

      return new ViewPublicCardDetailOutput({
        category: input.category,
        item: {
          id: entity.id,
          code: entity.code,
          title: constraint.title,
          description: entity.description,
          appliesToRole: constraint.appliesToRole,
          value: entity.value,
        },
      });
    }

    const doctor = await this.doctorRepository.findById(input.itemId);
    if (!doctor) return new ViewPublicCardDetailOutput({ category: input.category, item: null });

    return new ViewPublicCardDetailOutput({
      category: input.category,
      item: {
        id: doctor.id,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        department: doctor.department,
        availableSlotsPerDay: doctor.availableSlotsPerDay,
        status: doctor.status,
      },
    });
  }
}