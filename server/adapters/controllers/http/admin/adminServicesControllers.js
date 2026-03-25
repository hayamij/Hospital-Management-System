import { createHandler } from '../createHandler.js';
import { UpdateServiceCatalogItemViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin service catalog (pricing/services)
export function buildAdminServicesControllers({ configureServicesAndPricingUseCase }) {
  return {
    upsertService: createHandler({
      useCase: configureServicesAndPricingUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        action: req.body?.action ?? 'upsert',
        service: req.body?.service ?? req.body,
      }),
      mapOutput: (result) => new UpdateServiceCatalogItemViewModel(result),
    }),
    removeService: createHandler({
      useCase: configureServicesAndPricingUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        action: 'remove',
        service: { id: req.params?.serviceId },
      }),
      mapOutput: (result) => new UpdateServiceCatalogItemViewModel(result),
    }),
  };
}
