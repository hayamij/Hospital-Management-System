import { DomainError } from '../../../domain/exceptions/domainError.js';
import { OverrideAppointmentInput } from '../../dto/admin/overrideAppointmentInput.js';
import { OverrideAppointmentOutput } from '../../dto/admin/overrideAppointmentOutput.js';

export class OverrideAppointmentUseCase {
	constructor({ appointmentRepository, doctorRepository, userRepository }) {
		this.appointmentRepository = appointmentRepository;
		this.doctorRepository = doctorRepository;
		this.userRepository = userRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof OverrideAppointmentInput ? inputDto : new OverrideAppointmentInput(inputDto);

		if (!input.adminId) {
			throw new DomainError('Admin id is required.');
		}
		if (!input.appointmentId) {
			throw new DomainError('Appointment id is required.');
		}

		const allowedActions = new Set(['reschedule', 'cancel', 'assignDoctor']);
		if (!allowedActions.has(input.action)) {
			throw new DomainError('Invalid appointment override action.');
		}

		const adminUser = await this.userRepository.findById(input.adminId);
		const hasAdminRole = adminUser?.role === 'admin' || Array.isArray(adminUser?.roles) && adminUser.roles.includes('admin');
		if (!adminUser || !hasAdminRole) {
			throw new DomainError('Access denied. Admin role required.');
		}

		const appointment = await this.appointmentRepository.findById(input.appointmentId);
		if (!appointment) {
			throw new DomainError('Appointment not found.');
		}

		let updatedStatus = appointment.getStatus?.() ?? appointment.status;
		if (input.action === 'reschedule') {
			const startAt = input.startAt instanceof Date ? input.startAt : new Date(input.startAt);
			const endAt = input.endAt instanceof Date ? input.endAt : new Date(input.endAt);
			if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
				throw new DomainError('Valid start and end times are required to reschedule.');
			}
			appointment.reschedule(startAt, endAt);
			updatedStatus = appointment.getStatus?.() ?? appointment.status;
		} else if (input.action === 'cancel') {
			appointment.cancel();
			updatedStatus = appointment.getStatus?.() ?? appointment.status;
		} else if (input.action === 'assignDoctor') {
			if (!input.doctorId) {
				throw new DomainError('Doctor id is required to assign.');
			}

			const doctor = await this.doctorRepository.findById(input.doctorId);
			if (!doctor) {
				throw new DomainError('Doctor not found.');
			}

			appointment.doctorId = doctor.id ?? doctor.getId?.() ?? input.doctorId;
			appointment.status = 'scheduled';
			if (typeof appointment.touch === 'function') {
				appointment.touch();
			} else {
				appointment.updatedAt = new Date();
			}
			updatedStatus = appointment.getStatus?.() ?? appointment.status;
		}

		await this.appointmentRepository.save(appointment);

		return new OverrideAppointmentOutput({
			appointmentId: appointment.id ?? appointment.getId?.() ?? input.appointmentId,
			status: updatedStatus,
			startAt: appointment.getStartAt?.() ?? appointment.startAt,
			endAt: appointment.getEndAt?.() ?? appointment.endAt,
			doctorId: appointment.getDoctorId?.() ?? appointment.doctorId,
		});
	}
}
