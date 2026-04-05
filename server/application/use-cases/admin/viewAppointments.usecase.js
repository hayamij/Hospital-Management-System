import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewAppointmentsInput } from '../../dto/admin/viewAppointmentsInput.js';
import { ViewAppointmentsOutput } from '../../dto/admin/viewAppointmentsOutput.js';

export class ViewAppointmentsUseCase {
	constructor({ userRepository, appointmentRepository }) {
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ViewAppointmentsInput ? inputDto : new ViewAppointmentsInput(inputDto ?? {});

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		if (!adminUser || adminUser.role !== 'admin') {
			throw new DomainError('Access denied. Admin role required.');
		}

		const pageInput = input.page;
		const pageSizeInput = input.pageSize;
		const page = pageInput === undefined || pageInput === null || pageInput === '' ? 1 : Number(pageInput);
		const pageSize = pageSizeInput === undefined || pageSizeInput === null || pageSizeInput === '' ? 20 : Number(pageSizeInput);
		if (!Number.isFinite(page) || !Number.isFinite(pageSize) || page <= 0 || pageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}

		const listed = await this.appointmentRepository.list({
			status: input.status,
			doctorId: input.doctorId,
			patientId: input.patientId,
			page,
			pageSize,
		});
		const items = Array.isArray(listed?.items) ? listed.items : [];

		return new ViewAppointmentsOutput({
			appointments: items,
			page: Number(listed?.page) || Math.floor(page),
			pageSize: Number(listed?.pageSize) || Math.floor(pageSize),
			total: Number(listed?.total) || items.length,
		});
	}
}
