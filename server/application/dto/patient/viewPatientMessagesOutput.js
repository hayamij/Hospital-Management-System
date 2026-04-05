export class ViewPatientMessagesOutput {
	constructor({ messages, total, limit }) {
		this.messages = messages;
		this.total = total;
		this.limit = limit;
	}
}
