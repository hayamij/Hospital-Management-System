import { createHandler } from '../createHandler.js';

export function buildAdminControllers({
  createDoctorUseCase,
  updateDoctorUseCase,
  assignRolesUseCase,
  createServiceCatalogItemUseCase,
  updateServiceCatalogItemUseCase,
  generateReportUseCase,
}) {
  return {
    createDoctor: createHandler({
      useCase: createDoctorUseCase,
      mapInput: (req) => req.body,
      successStatus: 201,
    }),
    updateDoctor: createHandler({
      useCase: updateDoctorUseCase,
      mapInput: (req) => ({ id: req.params.id, ...req.body }),
    }),
    assignRoles: createHandler({
      useCase: assignRolesUseCase,
      mapInput: (req) => ({ userId: req.params.id, roles: req.body.roles }),
    }),
    createServiceCatalogItem: createHandler({
      useCase: createServiceCatalogItemUseCase,
      mapInput: (req) => req.body,
      successStatus: 201,
    }),
    updateServiceCatalogItem: createHandler({
      useCase: updateServiceCatalogItemUseCase,
      mapInput: (req) => ({ id: req.params.id, ...req.body }),
    }),
    generateReport: createHandler({
      useCase: generateReportUseCase,
      mapInput: (req) => ({ type: req.query.type, from: req.query.from, to: req.query.to }),
    }),
  };
}
