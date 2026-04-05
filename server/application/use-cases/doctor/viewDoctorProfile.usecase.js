import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewDoctorProfileInput } from '../../dto/doctor/viewDoctorProfileInput.js';
import { ViewDoctorProfileOutput } from '../../dto/doctor/viewDoctorProfileOutput.js';

export class ViewDoctorProfileUseCase {
	constructor({ doctorRepository }) {
		this.doctorRepository = doctorRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ViewDoctorProfileInput
				? inputDto
				: new ViewDoctorProfileInput(inputDto ?? {});

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		return new ViewDoctorProfileOutput({
			doctorId: doctor.id ?? doctor.getId?.() ?? input.doctorId,
			fullName: doctor.fullName ?? doctor.getName?.() ?? '',
			specialization: doctor.specialization ?? doctor.getSpecialization?.() ?? '',
			department: doctor.department ?? doctor.getDepartment?.() ?? '',
			status: doctor.status ?? doctor.getStatus?.() ?? 'active',
			slotsPerDay: doctor.getAvailableSlotsPerDay?.() ?? doctor.availableSlotsPerDay ?? 0,
			updatedAt: doctor.updatedAt ?? doctor.getUpdatedAt?.() ?? null,
		});
	}
}
