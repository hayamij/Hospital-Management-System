import { DomainError } from '../../../domain/exceptions/domainError.js';
import { RegisterPatientAccountInput } from '../../dto/patient/registerPatientAccountInput.js';
import { RegisterPatientAccountOutput } from '../../dto/patient/registerPatientAccountOutput.js';

export class RegisterPatientAccountUseCase {
	constructor({ userRepository, patientRepository, authService }) {
		this.userRepository = userRepository;
		this.patientRepository = patientRepository;
		this.authService = authService;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof RegisterPatientAccountInput
				? inputDto
				: new RegisterPatientAccountInput(inputDto ?? {});

		if (!input.fullName || !String(input.fullName).trim()) {
			throw new DomainError('Full name is required.');
		}
		if (!input.email || !String(input.email).trim()) {
			throw new DomainError('Email is required.');
		}
		if (!input.password || !String(input.password)) {
			throw new DomainError('Password is required.');
		}
		if (String(input.password).length < 8) {
			throw new DomainError('Password must be at least 8 characters.');
		}
		if (!input.phone || !String(input.phone).trim()) {
			throw new DomainError('Phone is required.');
		}

		const email = String(input.email).trim().toLowerCase();
		const existingUser = await this.userRepository.findByEmail(email);
		if (existingUser) {
			throw new DomainError('Email already registered.');
		}

		const passwordHash = await this.authService.hashPassword(input.password);

		const patientPayload = {
			fullName: String(input.fullName).trim(),
			contactInfo: { email, phone: String(input.phone).trim() },
			status: 'active',
			createdAt: new Date(),
		};
		const createdPatient = await this.patientRepository.create(patientPayload);
		const patientId = createdPatient?.id ?? createdPatient?.patientId ?? createdPatient;

		const user = {
			email,
			passwordHash,
			role: 'patient',
			status: 'active',
			patientId,
			fullName: patientPayload.fullName,
			createdAt: new Date(),
		};
		await this.userRepository.save(user);

		return new RegisterPatientAccountOutput({ patientId, status: 'active' });
	}
}
