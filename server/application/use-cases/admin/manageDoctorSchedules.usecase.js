import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ManageDoctorSchedulesInput } from '../../dto/admin/manageDoctorSchedulesInput.js';
import { ManageDoctorSchedulesOutput } from '../../dto/admin/manageDoctorSchedulesOutput.js';

export class ManageDoctorSchedulesUseCase {
	constructor({ doctorRepository, userRepository }) {
		this.doctorRepository = doctorRepository;
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ManageDoctorSchedulesInput ? inputDto : new ManageDoctorSchedulesInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (input.slotsPerDay === undefined || input.slotsPerDay === null) {
			throw new DomainError('Slots per day is required.');
		}
		if (Number.isNaN(Number(input.slotsPerDay)) || Number(input.slotsPerDay) < 0) {
			throw new DomainError('Slots per day must be a non-negative number.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		const hasAdminRole = adminUser?.role === 'admin' || Array.isArray(adminUser?.roles) && adminUser.roles.includes('admin');
		if (!adminUser || !hasAdminRole) {
			throw new DomainError('Access denied. Admin role required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		doctor.setAvailability(Number(input.slotsPerDay));
		await this.doctorRepository.save(doctor);

		const resolvedDoctorId = doctor.id ?? doctor.getId?.() ?? input.doctorId;
		return new ManageDoctorSchedulesOutput({ doctorId: resolvedDoctorId, slotsPerDay: doctor.getAvailableSlotsPerDay?.() ?? doctor.availableSlotsPerDay });
	}
}
