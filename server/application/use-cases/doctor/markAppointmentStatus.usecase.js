import { DomainError } from '../../../domain/exceptions/domainError.js';
import { MarkAppointmentStatusInput } from '../../dto/doctor/markAppointmentStatusInput.js';
import { MarkAppointmentStatusOutput } from '../../dto/doctor/markAppointmentStatusOutput.js';

export class MarkAppointmentStatusUseCase {
	constructor({ doctorRepository, appointmentRepository }) {
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof MarkAppointmentStatusInput ? inputDto : new MarkAppointmentStatusInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.appointmentId) {
			throw new DomainError('Appointment id is required.');
		}

		const allowed = new Set(['completed', 'no_show', 'cancelled']);
		if (!allowed.has(input.status)) {
			throw new DomainError('Invalid appointment status.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const appointment = await this.appointmentRepository.findById(input.appointmentId);
		if (!appointment) {
			throw new DomainError('Appointment not found.');
		}

		const appointmentDoctorId = appointment.getDoctorId?.() ?? appointment.doctorId;
		if (appointmentDoctorId && appointmentDoctorId !== input.doctorId) {
			throw new DomainError('Doctor is not assigned to this appointment.');
		}

		switch (input.status) {
			case 'completed':
				appointment.markCompleted();
				break;
			case 'no_show':
				appointment.markNoShow();
				break;
			case 'cancelled':
				appointment.cancel();
				break;
			default:
				throw new DomainError('Unsupported appointment status.');
		}

		await this.appointmentRepository.save(appointment);

		return new MarkAppointmentStatusOutput({
			appointmentId: appointment.id ?? appointment.getId?.() ?? input.appointmentId,
			status: appointment.getStatus?.() ?? appointment.status,
		});
	}
}
