export class StartRegistrationInput {
	constructor({ fullName, email, phone }) {
		this.fullName = fullName;
		this.email = email;
		this.phone = phone;
	}
}
