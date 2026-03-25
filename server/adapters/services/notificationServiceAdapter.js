import { NotificationServicePort } from '../../application/ports/services/notificationServicePort.js';

// Adapter: delegates notification sending to an injected provider (email/SMS/push)
export class NotificationServiceAdapter extends NotificationServicePort {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  async sendNotification(payload) {
    return this.inner.sendNotification(payload);
  }
}
