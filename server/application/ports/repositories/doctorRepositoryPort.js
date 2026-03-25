// Port for doctor persistence operations.
export class DoctorRepositoryPort {
	async findById(id) {
		throw new Error('DoctorRepositoryPort.findById not implemented');
	}

	async save(doctor) {
		throw new Error('DoctorRepositoryPort.save not implemented');
	}

	async search({ name, specialization } = {}) {
		throw new Error('DoctorRepositoryPort.search not implemented');
	}
}
