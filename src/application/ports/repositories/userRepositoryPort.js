// Port for user persistence operations.
export class UserRepositoryPort {
	async findByEmail(email) {
		throw new Error('UserRepositoryPort.findByEmail not implemented');
	}

	async findById(id) {
		throw new Error('UserRepositoryPort.findById not implemented');
	}

	async save(user) {
		throw new Error('UserRepositoryPort.save not implemented');
	}
}
