import { PaymentServicePort } from '../../application/ports/services/paymentServicePort.js';

// Adapter: delegates payment operations to an injected payment provider
export class PaymentServiceAdapter extends PaymentServicePort {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  async initiatePayment(payload) {
    return this.inner.initiatePayment(payload);
  }
}
