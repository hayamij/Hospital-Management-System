import { createHandler } from '../createHandler.js';
import { SearchDoctorsViewModel } from '../../../viewmodels/patientViewModels.js';

export function buildPatientDiscoveryControllers({ searchDoctorsUseCase }) {
  return {
    searchDoctors: createHandler({
      useCase: searchDoctorsUseCase,
      mapInput: (req) => ({ query: req.query?.q, specialty: req.query?.specialty, page: req.query?.page, pageSize: req.query?.pageSize }),
      mapOutput: (result) => new SearchDoctorsViewModel(result),
    }),
  };
}
