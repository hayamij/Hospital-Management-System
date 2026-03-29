import { createHandler } from '../createHandler.js';
import { AuditRecordViewModel } from '../../../viewmodels/adminViewModels.js';

// Admin medical record audits
export function buildAdminAuditControllers({ auditMedicalRecordsUseCase }) {
  return {
    auditRecord: createHandler({
      useCase: auditMedicalRecordsUseCase,
      mapInput: (req) => ({
        adminId: req.user?.id,
        recordId: req.params?.recordId,
        action: req.body?.action,
        reason: req.body?.reason,
      }),
      mapOutput: (result) => new AuditRecordViewModel(result),
    }),
  };
}
