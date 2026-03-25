import { createHandler } from '../createHandler.js';
import { ViewMedicalRecordsViewModel, DownloadPrescriptionViewModel } from '../../../viewmodels/patientViewModels.js';

export function buildPatientRecordsControllers({ viewMedicalRecordsUseCase, downloadPrescriptionUseCase }) {
  return {
    viewMedicalRecords: createHandler({
      useCase: viewMedicalRecordsUseCase,
      mapInput: (req) => ({ patientId: req.user?.id ?? req.query?.patientId, page: req.query?.page, pageSize: req.query?.pageSize }),
      mapOutput: (result) => new ViewMedicalRecordsViewModel(result),
    }),
    downloadPrescription: createHandler({
      useCase: downloadPrescriptionUseCase,
      mapInput: (req) => ({ prescriptionId: req.params?.id, patientId: req.user?.id ?? req.query?.patientId }),
      mapOutput: (result) => new DownloadPrescriptionViewModel(result),
    }),
  };
}
