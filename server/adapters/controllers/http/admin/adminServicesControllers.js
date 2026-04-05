import { createHandler } from '../createHandler.js';
import { UpdateServiceCatalogItemViewModel, ViewAdminServicesViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin service catalog (pricing/services)
export function buildAdminServicesControllers({ configureServicesAndPricingUseCase }) {
  return {
    listServices: createHandler({
      useCase: configureServicesAndPricingUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        action: 'list',
        query: req.query?.q,
        page: req.query?.page,
        pageSize: req.query?.pageSize,
      }),
      mapOutput: (result) => new ViewAdminServicesViewModel(result),
    }),
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
