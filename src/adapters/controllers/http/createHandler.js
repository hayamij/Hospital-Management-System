import { DomainError } from '../../../domain/exceptions/domainError.js';
import { JsonPresenter } from '../../presenters/jsonPresenter.js';

// Factory to wrap a use case into an Express-style handler.
export function createHandler({ useCase, mapInput, mapOutput = (result) => result, presenter = new JsonPresenter(), successStatus = 200 }) {
  return async function handler(req, res, next) {
    try {
      const input = mapInput(req);
      const result = await useCase.execute(input);
      const output = mapOutput(result);
      presenter.success(res, output, successStatus);
    } catch (err) {
      if (err instanceof DomainError) {
        presenter.error(res, err.message, 400);
        return;
      }
      next?.(err);
    }
  };
}
