// Port for prescription persistence operations.
export class PrescriptionRepositoryPort {
	async findById(id) {
		throw new Error('PrescriptionRepositoryPort.findById not implemented');
	}

	async listByPatient(patientId) {
		throw new Error('PrescriptionRepositoryPort.listByPatient not implemented');
	}
}
