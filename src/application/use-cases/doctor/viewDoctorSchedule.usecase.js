import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewDoctorScheduleInput } from '../../dto/doctor/viewDoctorScheduleInput.js';
import { ViewDoctorScheduleOutput } from '../../dto/doctor/viewDoctorScheduleOutput.js';

export class ViewDoctorScheduleUseCase {
	constructor({ doctorRepository, appointmentRepository }) {
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ViewDoctorScheduleInput ? inputDto : new ViewDoctorScheduleInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const range = {};
		if (input.from) {
			const fromDate = input.from instanceof Date ? input.from : new Date(input.from);
			if (!Number.isNaN(fromDate.getTime())) {
				range.from = fromDate;
			}
		}
		if (input.to) {
			const toDate = input.to instanceof Date ? input.to : new Date(input.to);
			if (!Number.isNaN(toDate.getTime())) {
				range.to = toDate;
			}
		}

		const appointments = await this.appointmentRepository.listByDoctor(input.doctorId, range);

		return new ViewDoctorScheduleOutput({
			doctorId: input.doctorId,
			appointments: appointments ?? [],
		});
	}
}
