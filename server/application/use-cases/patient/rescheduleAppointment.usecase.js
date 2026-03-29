import { DomainError } from '../../../domain/exceptions/domainError.js';
import { RescheduleAppointmentInput } from '../../dto/patient/rescheduleAppointmentInput.js';
import { RescheduleAppointmentOutput } from '../../dto/patient/rescheduleAppointmentOutput.js';

export class RescheduleAppointmentUseCase {
	constructor({ patientRepository, appointmentRepository, notificationService }) {
		this.patientRepository = patientRepository;
		this.appointmentRepository = appointmentRepository;
		this.notificationService = notificationService;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof RescheduleAppointmentInput
				? inputDto
				: new RescheduleAppointmentInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.appointmentId) {
			throw new DomainError('Appointment id is required.');
		}
		if (!input.startAt || !input.endAt) {
			throw new DomainError('New appointment time window is required.');
		}

		const startAt = input.startAt instanceof Date ? input.startAt : new Date(input.startAt);
		const endAt = input.endAt instanceof Date ? input.endAt : new Date(input.endAt);
		if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
			throw new DomainError('Invalid appointment date/time.');
		}
		if (endAt.getTime() <= startAt.getTime()) {
			throw new DomainError('Appointment end time must be after start time.');
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

		if (typeof appointment.reschedule === 'function') {
			appointment.reschedule(startAt, endAt);
		} else {
			appointment.startAt = startAt;
			appointment.endAt = endAt;
			appointment.status = 'scheduled';
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
				subject: 'Appointment rescheduled',
				message: 'A patient rescheduled an appointment.',
			});
		}

		return new RescheduleAppointmentOutput({
			appointmentId: appointment.id ?? appointment.getId?.() ?? input.appointmentId,
			status: appointment.getStatus?.() ?? appointment.status,
			startAt: appointment.startAt ?? appointment.getStartAt?.() ?? startAt,
			endAt: appointment.endAt ?? appointment.getEndAt?.() ?? endAt,
		});
	}
}
