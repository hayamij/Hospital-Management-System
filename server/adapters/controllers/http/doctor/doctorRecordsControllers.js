import { createHandler } from '../createHandler.js';
import {
  AddMedicalRecordEntryViewModel,
  CreateMedicalRecordViewModel,
  ViewPatientRecordsForDoctorViewModel,
} from '../../../viewmodels/doctorViewModels.js';

export function buildDoctorRecordsControllers({
  accessPatientChartUseCase,
  createMedicalRecordUseCase,
  addVisitNoteUseCase,
  updateMedicalRecordEntryUseCase,
  reviewTestResultsUseCase,
}) {
  return {
    accessPatientChart: createHandler({
      useCase: accessPatientChartUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.query?.doctorId,
        patientId: req.params?.patientId ?? req.query?.patientId,
      }),
      mapOutput: (result) => new ViewPatientRecordsForDoctorViewModel(result),
    }),
    createMedicalRecord: createHandler({
      useCase: createMedicalRecordUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        patientId: req.params?.patientId ?? req.body?.patientId,
      }),
      mapOutput: (result) => new CreateMedicalRecordViewModel(result),
    }),
    addVisitNote: createHandler({
      useCase: addVisitNoteUseCase,
      mapInput: (req) => ({
        doctorId: req.user?.id ?? req.body?.doctorId,
        patientId: req.params?.patientId ?? req.body?.patientId,
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
