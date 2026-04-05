import { DomainError } from '../../../domain/exceptions/domainError.js';
import { Billing } from '../../../domain/entities/billing.js';
import { MarkAppointmentStatusInput } from '../../dto/doctor/markAppointmentStatusInput.js';
import { MarkAppointmentStatusOutput } from '../../dto/doctor/markAppointmentStatusOutput.js';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const toAmount = (value) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const buildInvoiceNumber = (appointmentId) => {
	const safeAppointment = String(appointmentId || 'unknown')
		.toUpperCase()
		.replace(/[^A-Z0-9-]/g, '');
	return `INV-SVC-${safeAppointment}-${Date.now()}`;
};

export class MarkAppointmentStatusUseCase {
	constructor({ doctorRepository, appointmentRepository, billingRepository, serviceCatalogRepository }) {
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
		this.billingRepository = billingRepository;
		this.serviceCatalogRepository = serviceCatalogRepository;
	}

	async resolveServiceCharge(reason, appointmentId) {
		const services = (await this.serviceCatalogRepository?.listServices?.()) ?? [];
		const normalizedReason = normalizeText(reason);

		const exact = services.find((service) => {
			const byName = normalizeText(service?.name);
			const byId = normalizeText(service?.id);
			return byName && (byName === normalizedReason || byId === normalizedReason);
		});

		const fuzzy =
			exact ??
			services.find((service) => {
				const serviceName = normalizeText(service?.name);
				if (!serviceName || !normalizedReason) return false;
				return normalizedReason.includes(serviceName) || serviceName.includes(normalizedReason);
			});

		const consultationFallback =
			fuzzy ??
			services.find((service) => {
				const serviceName = normalizeText(service?.name);
				return serviceName.includes('consult');
			});

		const matchedService = consultationFallback ?? null;
		const serviceName = matchedService?.name ?? (String(reason || '').trim() || 'Consultation');

		return {
			description: serviceName,
			serviceName,
			serviceId: matchedService?.id ?? null,
			appointmentId,
			amount: toAmount(matchedService?.price),
		};
	}

	async maybeCreateServiceBilling(appointment) {
		if (!this.billingRepository?.save || !this.billingRepository?.listByPatient) {
			return;
		}

		const appointmentId = appointment.id ?? appointment.getId?.() ?? null;
		const patientId = appointment.getPatientId?.() ?? appointment.patientId ?? null;
		const reason = appointment.getReason?.() ?? appointment.reason ?? '';
		if (!appointmentId || !patientId) {
			return;
		}

		const existing = (await this.billingRepository.listByPatient(patientId)) ?? [];
		const hasGeneratedInvoice = existing.some((invoice) => {
			const charges = invoice?.charges ?? invoice?.getCharges?.() ?? [];
			return Array.isArray(charges)
				&& charges.some((line) => String(line?.appointmentId || '') === String(appointmentId));
		});

		if (hasGeneratedInvoice) {
			return;
		}

		const chargeLine = await this.resolveServiceCharge(reason, appointmentId);
		const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const billing = new Billing({
			invoiceNumber: buildInvoiceNumber(appointmentId),
			patientId,
			charges: [chargeLine],
			status: 'issued',
			dueDate,
			createdAt: new Date(),
		});

		await this.billingRepository.save(billing);
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
		if (input.status === 'completed') {
			await this.maybeCreateServiceBilling(appointment);
		}

		return new MarkAppointmentStatusOutput({
			appointmentId: appointment.id ?? appointment.getId?.() ?? input.appointmentId,
			status: appointment.getStatus?.() ?? appointment.status,
		});
	}
}
