import { ViewPublicServicesUseCase } from '../../../application/use-cases/guest/viewPublicServices.usecase.js';
import { ViewPublicServiceDetailUseCase } from '../../../application/use-cases/guest/viewPublicServiceDetail.usecase.js';
import { ViewDoctorDirectoryUseCase } from '../../../application/use-cases/guest/viewDoctorDirectory.usecase.js';
import { ViewPublicCardDetailUseCase } from '../../../application/use-cases/guest/viewPublicCardDetail.usecase.js';
import { SubmitContactLeadUseCase } from '../../../application/use-cases/guest/submitContactLead.usecase.js';
import { StartGuestRegistrationUseCase } from '../../../application/use-cases/guest/startGuestRegistration.usecase.js';
import { adaptUseCase } from './common.js';

export const createGuestUseCases = ({
  serviceCatalogRepository,
  doctorRepository,
  contactLeadRepository,
}) => {
  const viewPublicServicesClass = new ViewPublicServicesUseCase({
    serviceCatalogRepository,
  });
  const viewPublicServiceDetailClass = new ViewPublicServiceDetailUseCase({
    serviceCatalogRepository,
  });
  const viewDoctorDirectoryClass = new ViewDoctorDirectoryUseCase({
    doctorRepository,
  });
  const viewPublicCardDetailClass = new ViewPublicCardDetailUseCase({
    doctorRepository,
  });
  const submitContactLeadClass = new SubmitContactLeadUseCase({
    contactLeadRepository,
  });
  const startGuestRegistrationClass = new StartGuestRegistrationUseCase({
    contactLeadRepository,
  });

  const viewPublicServicesUseCase = adaptUseCase(
    viewPublicServicesClass,
    undefined,
    (result) => ({
      page: 1,
      pageSize: result.services?.length ?? 0,
      total: result.services?.length ?? 0,
      services: result.services ?? [],
    })
  );
  const viewDoctorDirectoryUseCase = adaptUseCase(
    viewDoctorDirectoryClass,
    undefined,
    (result) => ({
      page: 1,
      pageSize: result.doctors?.length ?? 0,
      total: result.doctors?.length ?? 0,
      doctors: result.doctors ?? [],
    })
  );

  return {
    viewPublicServicesUseCase,
    viewPublicServiceDetailUseCase: viewPublicServiceDetailClass,
    viewDoctorDirectoryUseCase,
    viewPublicCardDetailUseCase: viewPublicCardDetailClass,
    submitContactLeadUseCase: submitContactLeadClass,
    startGuestRegistrationUseCase: startGuestRegistrationClass,
  };
};
