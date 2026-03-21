import { DomainError } from '../../../domain/exceptions/domainError.js';
import { CancelAppointmentInput } from '../../dto/patient/cancelAppointmentInput.js';
import { CancelAppointmentOutput } from '../../dto/patient/cancelAppointmentOutput.js';

export class CancelAppointmentUseCase {
	constructor({ patientRepository, appointmentRepository, notificationService }) {
		this.patientRepository = patientRepository;
		this.appointmentRepository = appointmentRepository;
		this.notificationService = notificationService;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof CancelAppointmentInput ? inputDto : new CancelAppointmentInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.appointmentId) {
			throw new DomainError('Appointment id is required.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const appointment = await this.appointmentRepository.findById(input.appointmentId);
		if (!appointment) {
			throw new DomainError('Appointment not found.');
		}

		const appointmentPatientId = appointment.getPatientId?.() ?? appointment.patientId;
		if (appointmentPatientId && appointmentPatientId !== input.patientId) {
			throw new DomainError('Appointment does not belong to patient.');
		}

		if (typeof appointment.cancel === 'function') {
			appointment.cancel();
		} else {
			appointment.status = 'cancelled';
			if (typeof appointment.touch === 'function') {
				appointment.touch();
			} else {
				appointment.updatedAt = new Date();
			}
		}

		await this.appointmentRepository.save(appointment);

		if (this.notificationService?.sendNotification) {
			await this.notificationService.sendNotification({
				recipientId: appointment.doctorId ?? appointment.getDoctorId?.(),
				channel: 'in_app',
				subject: 'Appointment cancelled',
				message: 'Patient cancelled the appointment.',
			});
		}

		return new CancelAppointmentOutput({
			appointmentId: appointment.id ?? appointment.getId?.() ?? input.appointmentId,
			status: appointment.getStatus?.() ?? appointment.status,
		});
	}
}
