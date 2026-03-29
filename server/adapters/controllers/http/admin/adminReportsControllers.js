import { createHandler } from '../createHandler.js';
import { GenerateReportViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin reports
export function buildAdminReportsControllers({ runReportUseCase }) {
  return {
    runReport: createHandler({
      useCase: runReportUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        reportName: req.query?.reportName,
        params: req.query ?? {},
      }),
      mapOutput: (result) => new GenerateReportViewModel(result),
    }),
  };
}
