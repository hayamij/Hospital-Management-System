// Port for messaging between doctors/patients.
export class MessageRepositoryPort {
	async create(message) {
		throw new Error('MessageRepositoryPort.create not implemented');
	}

	async listForDoctor(doctorId, options = {}) {
		throw new Error('MessageRepositoryPort.listForDoctor not implemented');
	}

	async listForPatient(patientId, options = {}) {
		throw new Error('MessageRepositoryPort.listForPatient not implemented');
	}
}
