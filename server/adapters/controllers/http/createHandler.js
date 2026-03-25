import { DomainError } from '../../../domain/exceptions/domainError.js';
import { JsonPresenter } from '../../presenters/jsonPresenter.js';

// Factory to wrap a use case into an Express-style handler.
// Supports optional Zod schema validation via `validate`.
export function createHandler({ useCase, mapInput, mapOutput = (result) => result, presenter = new JsonPresenter(), successStatus = 200, validate }) {
  return async function handler(req, res, next) {
    try {
      let input = mapInput(req);
      if (validate) {
        const parsed = validate.safeParse ? validate.safeParse(input) : validate.parse(input);
        if (parsed?.success === false) {
          presenter.error(res, parsed.error?.message ?? 'Invalid input', 400, 'validation_error');
          return;
        }
        input = parsed?.success ? parsed.data : parsed;
      }
      const result = await useCase.execute(input);
      const output = mapOutput(result);
      presenter.success(res, output, successStatus);
    } catch (err) {
      if (err instanceof DomainError) {
        presenter.error(res, err.message, 400, 'domain_error');
        return;
      }
      const status = err.statusCode || err.status || 500;
      const code = err.code || (status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 404 ? 'not_found' : 'internal_error');
      console.error('Handler error:', err); // lightweight logging
      presenter.error(res, err.message || 'Internal server error', status, code);
    }
  };
}
