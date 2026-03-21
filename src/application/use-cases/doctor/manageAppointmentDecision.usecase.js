import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ManageAppointmentDecisionInput } from '../../dto/doctor/manageAppointmentDecisionInput.js';
import { ManageAppointmentDecisionOutput } from '../../dto/doctor/manageAppointmentDecisionOutput.js';

export class ManageAppointmentDecisionUseCase {
	constructor({ doctorRepository, appointmentRepository }) {
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof ManageAppointmentDecisionInput ? inputDto : new ManageAppointmentDecisionInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.appointmentId) {
			throw new DomainError('Appointment id is required.');
		}
		const allowed = new Set(['accept', 'reject']);
		if (!allowed.has(input.decision)) {
			throw new DomainError('Invalid decision.');
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

		if (input.decision === 'accept') {
			appointment.status = 'scheduled';
		} else {
			appointment.cancel();
		}

		if (typeof appointment.touch === 'function') {
			appointment.touch();
		} else {
			appointment.updatedAt = new Date();
		}

		await this.appointmentRepository.save(appointment);

		return new ManageAppointmentDecisionOutput({
			appointmentId: appointment.id ?? appointment.getId?.() ?? input.appointmentId,
			status: appointment.getStatus?.() ?? appointment.status,
		});
	}
}
