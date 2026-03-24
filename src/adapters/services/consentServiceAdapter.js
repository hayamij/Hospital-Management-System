import { ConsentServicePort } from '../../application/ports/services/consentServicePort.js';

// Adapter: delegates consent verification to an injected compliance provider
export class ConsentServiceAdapter extends ConsentServicePort {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  async verifyConsent(payload) {
    return this.inner.verifyConsent(payload);
  }
}
