// Port for consent/compliance checks (HIPAA/GDPR style).
export class ConsentServicePort {
	async verifyConsent({ patientId, purpose }) {
		throw new Error('ConsentServicePort.verifyConsent not implemented');
	}
}
