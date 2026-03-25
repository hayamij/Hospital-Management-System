// Port for patient persistence operations.
export class PatientRepositoryPort {
	async findById(id) {
		throw new Error('PatientRepositoryPort.findById not implemented');
	}

	async save(patient) {
		throw new Error('PatientRepositoryPort.save not implemented');
	}

	async create(patient) {
		throw new Error('PatientRepositoryPort.create not implemented');
	}
}
