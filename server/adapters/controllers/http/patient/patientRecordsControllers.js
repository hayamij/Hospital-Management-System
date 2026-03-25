import { createHandler } from '../createHandler.js';
import { ViewMedicalRecordsViewModel, DownloadPrescriptionViewModel } from '../../../viewmodels/patientViewModels.js';

const resolvePatientId = (req, fallback) =>
  req.user?.patientId ?? req.user?.id ?? fallback;

export function buildPatientRecordsControllers({ viewMedicalRecordsUseCase, downloadPrescriptionUseCase }) {
  return {
    viewMedicalRecords: createHandler({
      useCase: viewMedicalRecordsUseCase,
      mapInput: (req) => ({ patientId: resolvePatientId(req, req.query?.patientId), page: req.query?.page, pageSize: req.query?.pageSize }),
      mapOutput: (result) => new ViewMedicalRecordsViewModel(result),
    }),
    downloadPrescription: createHandler({
      useCase: downloadPrescriptionUseCase,
      mapInput: (req) => ({ prescriptionId: req.params?.id, patientId: resolvePatientId(req, req.query?.patientId) }),
      mapOutput: (result) => new DownloadPrescriptionViewModel(result),
    }),
  };
}
