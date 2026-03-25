export class MarkAppointmentStatusInput {
	constructor({ doctorId, appointmentId, status }) {
		this.doctorId = doctorId;
		this.appointmentId = appointmentId;
		this.status = status; // 'completed' | 'no_show' | 'cancelled'
	}
}
