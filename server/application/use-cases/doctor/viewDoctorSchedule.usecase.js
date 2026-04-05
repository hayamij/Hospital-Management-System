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
		const pageInput = input.page;
		const pageSizeInput = input.pageSize;
		const parsedPage =
			pageInput === undefined || pageInput === null || pageInput === ''
				? 1
				: Number(pageInput);
		const parsedPageSize =
			pageSizeInput === undefined || pageSizeInput === null || pageSizeInput === ''
				? 20
				: Number(pageSizeInput);
		if (!Number.isFinite(parsedPage) || !Number.isFinite(parsedPageSize) || parsedPage <= 0 || parsedPageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}
		const page = Math.floor(parsedPage);
		const pageSize = Math.floor(parsedPageSize);

		const normalized = Array.isArray(appointments) ? appointments : [appointments].filter(Boolean);
		const statusFilter = input.status ? String(input.status).trim().toLowerCase() : null;
		const filtered = statusFilter
			? normalized.filter((appt) => {
				const status = String(appt?.getStatus?.() ?? appt?.status ?? '').toLowerCase();
				if (statusFilter === 'pending') {
					return status === 'pending' || status === 'requested';
				}
				return status === statusFilter;
			})
			: normalized;

		const total = filtered.length;
		const start = (page - 1) * pageSize;
		const pagedAppointments = filtered.slice(start, start + pageSize);

		return new ViewDoctorScheduleOutput({
			doctorId: input.doctorId,
			appointments: pagedAppointments,
			page,
			pageSize,
			total,
			status: statusFilter,
		});
	}
}
