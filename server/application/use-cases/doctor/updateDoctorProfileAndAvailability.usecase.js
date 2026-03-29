import { DomainError } from '../../../domain/exceptions/domainError.js';
import { UpdateDoctorProfileAndAvailabilityInput } from '../../dto/doctor/updateDoctorProfileAndAvailabilityInput.js';
import { UpdateDoctorProfileAndAvailabilityOutput } from '../../dto/doctor/updateDoctorProfileAndAvailabilityOutput.js';

export class UpdateDoctorProfileAndAvailabilityUseCase {
	constructor({ doctorRepository }) {
		this.doctorRepository = doctorRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof UpdateDoctorProfileAndAvailabilityInput ? inputDto : new UpdateDoctorProfileAndAvailabilityInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const { profile = {}, slotsPerDay } = input;

		if (profile.fullName !== undefined) {
			if (!String(profile.fullName).trim()) {
				throw new DomainError('Doctor name cannot be empty.');
			}
			doctor.fullName = String(profile.fullName).trim();
		}

		if (profile.specialization !== undefined) {
			if (!String(profile.specialization).trim()) {
				throw new DomainError('Specialization cannot be empty.');
			}
			doctor.specialization = String(profile.specialization).trim();
		}

		if (profile.department !== undefined) {
			doctor.department = String(profile.department ?? '').trim();
		}

		if (profile.status === 'active') {
			doctor.activate?.();
		} else if (profile.status === 'inactive') {
			doctor.deactivate?.();
		} else if (profile.status === 'on_leave') {
			doctor.markOnLeave?.();
		} else if (profile.status !== undefined) {
			throw new DomainError('Invalid doctor status.');
		}

		if (slotsPerDay !== undefined && slotsPerDay !== null) {
			if (Number.isNaN(Number(slotsPerDay)) || Number(slotsPerDay) < 0) {
				throw new DomainError('Slots per day must be non-negative.');
			}
			doctor.setAvailability(Number(slotsPerDay));
		}

		if (typeof doctor.touch === 'function') {
			doctor.touch();
		} else {
			doctor.updatedAt = new Date();
		}

		await this.doctorRepository.save(doctor);

		const resolvedDoctorId = doctor.id ?? doctor.getId?.() ?? input.doctorId;
		return new UpdateDoctorProfileAndAvailabilityOutput({
			doctorId: resolvedDoctorId,
			profile: {
				fullName: doctor.fullName,
				specialization: doctor.specialization,
				department: doctor.department,
				status: doctor.status,
			},
			slotsPerDay: doctor.getAvailableSlotsPerDay?.() ?? doctor.availableSlotsPerDay,
		});
	}
}
