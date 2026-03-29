import { BrowsePublicInfoUseCase } from '../../../application/use-cases/guest/browsePublicInfo.usecase.js';
import { ViewPublicServiceDetailUseCase } from '../../../application/use-cases/guest/viewPublicServiceDetail.usecase.js';
import { GuestSearchDoctorsUseCase } from '../../../application/use-cases/guest/guestSearchDoctors.usecase.js';
import { ViewPublicCardDetailUseCase } from '../../../application/use-cases/guest/viewPublicCardDetail.usecase.js';
import { SubmitContactFormUseCase } from '../../../application/use-cases/guest/submitContactForm.usecase.js';
import { StartRegistrationUseCase } from '../../../application/use-cases/guest/startRegistration.usecase.js';
import { adaptUseCase } from './common.js';

export const createGuestUseCases = ({
  serviceCatalogRepository,
  settingsRepository,
  doctorRepository,
  patientRepository,
  contactLeadRepository,
}) => {
  const browsePublicInfoClass = new BrowsePublicInfoUseCase({
    serviceCatalogRepository,
    settingsRepository:
      settingsRepository || {
        async getSettings() {
          return {};
        },
      },
  });
  const viewPublicServiceDetailClass = new ViewPublicServiceDetailUseCase({
    serviceCatalogRepository,
  });
  const guestSearchDoctorsClass = new GuestSearchDoctorsUseCase({
    doctorRepository,
  });
  const viewPublicCardDetailClass = new ViewPublicCardDetailUseCase({
    doctorRepository,
  });
  const submitContactFormClass = new SubmitContactFormUseCase({
    contactLeadRepository,
  });
  const startRegistrationClass = new StartRegistrationUseCase({
    patientRepository,
  });

  const browsePublicInfoUseCase = adaptUseCase(
    browsePublicInfoClass,
    undefined,
    (result) => ({
      page: 1,
      pageSize: result.services?.length ?? 0,
      total: result.services?.length ?? 0,
      services: result.services ?? [],
    })
  );
  const guestSearchDoctorsUseCase = adaptUseCase(
    guestSearchDoctorsClass,
    (input) => ({
      name: input?.name ?? input?.query,
      specialization: input?.specialization ?? input?.specialty,
    }),
    (result) => ({
      page: 1,
      pageSize: result.doctors?.length ?? 0,
      total: result.doctors?.length ?? 0,
      doctors: result.doctors ?? [],
    })
  );

  return {
    browsePublicInfoUseCase,
    viewPublicServicesUseCase: browsePublicInfoUseCase,
    viewPublicServiceDetailUseCase: viewPublicServiceDetailClass,
    guestSearchDoctorsUseCase,
    viewDoctorDirectoryUseCase: guestSearchDoctorsUseCase,
    viewPublicCardDetailUseCase: viewPublicCardDetailClass,
    submitContactFormUseCase: submitContactFormClass,
    submitContactLeadUseCase: submitContactFormClass,
    startRegistrationUseCase: startRegistrationClass,
    startGuestRegistrationUseCase: startRegistrationClass,
  };
};
