// Port for sending notifications (push/email/SMS).
export class NotificationServicePort {
	async sendNotification({ recipientId, channel, subject, message }) {
		throw new Error('NotificationServicePort.sendNotification not implemented');
	}
}
