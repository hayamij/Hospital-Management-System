// Port for payment persistence operations.
export class PaymentRepositoryPort {
	async listByPatient(patientId) {
		throw new Error('PaymentRepositoryPort.listByPatient not implemented');
	}

	async create(payment) {
		throw new Error('PaymentRepositoryPort.create not implemented');
	}

	async findById(paymentId) {
		throw new Error('PaymentRepositoryPort.findById not implemented');
	}

	async updateStatus(paymentId, status) {
		throw new Error('PaymentRepositoryPort.updateStatus not implemented');
	}

	async listPendingForDoctor(doctorId, { page, pageSize, status } = {}) {
		throw new Error('PaymentRepositoryPort.listPendingForDoctor not implemented');
	}
}
