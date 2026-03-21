export class SendPatientMessageOutput {
	constructor({ messageId, status, sentAt }) {
		this.messageId = messageId;
		this.status = status;
		this.sentAt = sentAt;
	}
}
