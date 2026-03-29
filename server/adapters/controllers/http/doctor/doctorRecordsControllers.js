import { createHandler } from '../createHandler.js';
import { AddMedicalRecordEntryViewModel, ViewPatientRecordsForDoctorViewModel } from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorRecordsControllers({ accessPatientChartUseCase, addVisitNoteUseCase, updateMedicalRecordEntryUseCase, reviewTestResultsUseCase }) {
  return {
    accessPatientChart: createHandler({
      useCase: accessPatientChartUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.query?.doctorId,
        patientId: req.params?.patientId ?? req.query?.patientId,
      }),
      mapOutput: (result) => new ViewPatientRecordsForDoctorViewModel(result),
    }),
    addVisitNote: createHandler({
      useCase: addVisitNoteUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        patientId: req.body?.patientId,
        note: req.body?.note,
      }),
      mapOutput: (result) => new AddMedicalRecordEntryViewModel(result),
      successStatus: 201,
    }),
    updateMedicalRecordEntry: createHandler({
      useCase: updateMedicalRecordEntryUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        recordId: req.params?.recordId,
        note: req.body?.note,
      }),
      mapOutput: (result) => new AddMedicalRecordEntryViewModel(result),
    }),
    reviewTestResults: createHandler({
      useCase: reviewTestResultsUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        labResultId: req.params?.labResultId ?? req.body?.labResultId,
        notes: req.body?.notes,
      }),
    }),
  };
}
