export class MarkAppointmentStatusInput {
	constructor({ doctorId, appointmentId, status, invoiceDetails }) {
		this.doctorId = doctorId;
		this.appointmentId = appointmentId;
		this.status = status; // 'completed' | 'no_show' | 'cancelled'
		this.invoiceDetails = invoiceDetails;
	}
}
