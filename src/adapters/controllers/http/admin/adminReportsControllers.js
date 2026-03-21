import { createHandler } from '../createHandler.js';
import { GenerateReportViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin reports
export function buildAdminReportsControllers({ runReportsUseCase }) {
  return {
    runReport: createHandler({
      useCase: runReportsUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        reportName: req.query?.reportName,
        params: req.query ?? {},
      }),
      mapOutput: (result) => new GenerateReportViewModel(result),
    }),
  };
}
