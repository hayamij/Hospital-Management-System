import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ViewAppointmentsInput } from '../../dto/patient/viewAppointmentsInput.js';
import { ViewAppointmentsOutput } from '../../dto/patient/viewAppointmentsOutput.js';

export class ViewAppointmentsUseCase {
	constructor({ patientRepository, appointmentRepository }) {
		this.patientRepository = patientRepository;
		this.appointmentRepository = appointmentRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ViewAppointmentsInput ? inputDto : new ViewAppointmentsInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}

		const page = Number(input.page) || 1;
		const pageSize = Number(input.pageSize) || 20;
		if (page <= 0 || pageSize <= 0) {
			throw new DomainError('Invalid pagination parameters.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const fetched =
			(await this.appointmentRepository.listByPatient(input.patientId, {
				status: input.status,
				page,
				pageSize,
			})) ?? [];

		const normalized = Array.isArray(fetched) ? fetched : [fetched].filter(Boolean);
		const statusFilter = input.status ? String(input.status).toLowerCase() : null;
		const filtered = statusFilter
			? normalized.filter((appt) => (appt.getStatus?.() ?? appt.status)?.toLowerCase() === statusFilter)
			: normalized;
		const total = filtered.length;
		const start = (page - 1) * pageSize;
		const appointments = filtered.slice(start, start + pageSize);

		return new ViewAppointmentsOutput({ appointments, page, pageSize, total });
	}
}
