export class MarkAppointmentStatusOutput {
	constructor({ appointmentId, status, billingCreated = false, invoiceId = null, invoiceNumber = null }) {
		this.appointmentId = appointmentId;
		this.status = status;
		this.billingCreated = billingCreated;
		this.invoiceId = invoiceId;
		this.invoiceNumber = invoiceNumber;
	}
}
