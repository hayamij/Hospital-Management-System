import { DomainError } from '../../../domain/exceptions/domainError.js';
import { Appointment } from '../../../domain/entities/appointment.js';
import { ScheduleAppointmentInput } from '../../dto/patient/scheduleAppointmentInput.js';
import { ScheduleAppointmentOutput } from '../../dto/patient/scheduleAppointmentOutput.js';

export class ScheduleAppointmentUseCase {
	constructor({ patientRepository, doctorRepository, appointmentRepository, notificationService }) {
		this.patientRepository = patientRepository;
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
		this.notificationService = notificationService;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof ScheduleAppointmentInput ? inputDto : new ScheduleAppointmentInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.startAt) {
			throw new DomainError('Appointment start time is required.');
		}
		if (!input.endAt) {
			throw new DomainError('Appointment end time is required.');
		}
		if (!input.reason || !String(input.reason).trim()) {
			throw new DomainError('Appointment reason is required.');
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

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const appointment = new Appointment({
			patientId: input.patientId,
			doctorId: input.doctorId,
			startAt,
			endAt,
			reason: String(input.reason).trim(),
			status: 'pending',
			createdAt: new Date(),
		});

		const saved = await this.appointmentRepository.save(appointment);
		const appointmentId = saved?.id ?? saved?.appointmentId ?? appointment.id ?? null;
		const status = saved?.status ?? appointment.getStatus?.() ?? appointment.status ?? 'pending';

		if (this.notificationService?.sendNotification) {
			await this.notificationService.sendNotification({
				recipientId: input.doctorId,
				channel: 'in_app',
				subject: 'New appointment request',
				message: `Patient ${input.patientId} requested an appointment.`,
			});
		}

		return new ScheduleAppointmentOutput({ appointmentId, status, startAt, endAt });
	}
}
