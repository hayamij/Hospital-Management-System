import { createHandler } from './createHandler.js';
import {
  BrowsePublicInfoViewModel,
  GuestSearchDoctorsViewModel,
  StartRegistrationViewModel,
  SubmitContactFormViewModel,
  ViewAvailableSlotsViewModel,
  ViewPublicCardDetailViewModel,
  ViewPublicServiceDetailViewModel,
} from '../../viewmodels/guestViewModels.js';

export function buildGuestControllers({ browsePublicInfoUseCase, guestSearchDoctorsUseCase, startRegistrationUseCase, submitContactFormUseCase, viewAvailableSlotsUseCase, viewPublicServiceDetailUseCase, viewPublicCardDetailUseCase }) {
  return {
    browsePublicInfo: createHandler({
      useCase: browsePublicInfoUseCase,
      mapInput: () => ({}),
      mapOutput: (result) => new BrowsePublicInfoViewModel(result),
    }),
    guestSearchDoctors: createHandler({
      useCase: guestSearchDoctorsUseCase,
      mapInput: (req) => ({ name: req.query?.name ?? req.query?.q, specialization: req.query?.specialization }),
      mapOutput: (result) => new GuestSearchDoctorsViewModel(result),
    }),
    startRegistration: createHandler({
      useCase: startRegistrationUseCase,
      mapInput: (req) => req.body ?? {},
      mapOutput: (result) => new StartRegistrationViewModel(result),
      successStatus: 201,
    }),
    submitContactForm: createHandler({
      useCase: submitContactFormUseCase,
      mapInput: (req) => req.body ?? {},
      mapOutput: (result) => new SubmitContactFormViewModel(result),
      successStatus: 201,
    }),
    viewAvailableSlots: createHandler({
      useCase: viewAvailableSlotsUseCase,
      mapInput: (req) => ({ doctorId: req.query?.doctorId ?? req.params?.doctorId, from: req.query?.from, to: req.query?.to }),
      mapOutput: (result) => new ViewAvailableSlotsViewModel(result),
    }),
    viewPublicServiceDetail: createHandler({
      useCase: viewPublicServiceDetailUseCase,
      mapInput: (req) => ({ serviceId: req.params?.serviceId }),
      mapOutput: (result) => new ViewPublicServiceDetailViewModel(result),
    }),
    viewPublicCardDetail: createHandler({
      useCase: viewPublicCardDetailUseCase,
      mapInput: (req) => ({ category: req.params?.category, itemId: req.params?.itemId }),
      mapOutput: (result) => new ViewPublicCardDetailViewModel(result),
    }),
  };
}
