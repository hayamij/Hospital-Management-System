export class SendDoctorMessageOutput {
	constructor({ messageId, delivered }) {
		this.messageId = messageId;
		this.delivered = delivered;
	}
}
