// Port for medical record persistence operations.
export class MedicalRecordRepositoryPort {
	async findById(recordId) {
		throw new Error('MedicalRecordRepositoryPort.findById not implemented');
	}

	async save(record) {
		throw new Error('MedicalRecordRepositoryPort.save not implemented');
	}

	async findByPatientId(patientId) {
		throw new Error('MedicalRecordRepositoryPort.findByPatientId not implemented');
	}
}
