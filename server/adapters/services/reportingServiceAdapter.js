import { ReportingServicePort } from '../../application/ports/services/reportingServicePort.js';

// Adapter: delegates reporting to an injected reporting engine
export class ReportingServiceAdapter extends ReportingServicePort {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  async runReport(params) {
    return this.inner.runReport(params);
  }
}
