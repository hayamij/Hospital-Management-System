// Port for processing patient payments.
export class PaymentServicePort {
	async initiatePayment({ patientId, invoiceId, amount, method }) {
		throw new Error('PaymentServicePort.initiatePayment not implemented');
	}
}
