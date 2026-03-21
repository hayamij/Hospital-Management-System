// Port for appointment persistence operations.
export class AppointmentRepositoryPort {
	async findById(id) {
		throw new Error('AppointmentRepositoryPort.findById not implemented');
	}

	async save(appointment) {
		throw new Error('AppointmentRepositoryPort.save not implemented');
	}
}
