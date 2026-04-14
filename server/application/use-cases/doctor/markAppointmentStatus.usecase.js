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

const normalizeInvoiceDetails = (input) => {
	if (!input || typeof input !== 'object') return null;

	const amountRaw = Number(input.amount);
	const amount = Number.isFinite(amountRaw) ? amountRaw : Number.NaN;
	const serviceName = String(input.serviceName ?? input.service ?? input.description ?? '').trim();
	const note = String(input.note ?? '').trim();
	const invoiceNumber = String(input.invoiceNumber ?? '').trim();

	let dueDate = null;
	if (input.dueDate) {
		const parsedDueDate = new Date(input.dueDate);
		if (!Number.isNaN(parsedDueDate.getTime())) {
			dueDate = parsedDueDate;
		}
	}

	return {
		amount,
		serviceName,
		note,
		invoiceNumber,
		dueDate,
	};
};

export class MarkAppointmentStatusUseCase {
	constructor({ doctorRepository, appointmentRepository, billingRepository, serviceCatalogRepository }) {
		this.doctorRepository = doctorRepository;
		this.appointmentRepository = appointmentRepository;
		this.billingRepository = billingRepository;
		this.serviceCatalogRepository = serviceCatalogRepository;
	}

	async resolveServiceCharge(reason, appointmentId, invoiceDetails) {
		if (invoiceDetails) {
			return {
				description: invoiceDetails.serviceName,
				serviceName: invoiceDetails.serviceName,
				serviceId: null,
				appointmentId,
				amount: invoiceDetails.amount,
				note: invoiceDetails.note || null,
			};
		}

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
			note: null,
		};
	}

	async maybeCreateServiceBilling(appointment, inputInvoiceDetails) {
		if (!this.billingRepository?.save || !this.billingRepository?.listByPatient) {
			return { created: false, invoice: null };
		}

		const appointmentId = appointment.id ?? appointment.getId?.() ?? null;
		const patientId = appointment.getPatientId?.() ?? appointment.patientId ?? null;
		const reason = appointment.getReason?.() ?? appointment.reason ?? '';
		if (!appointmentId || !patientId) {
			return { created: false, invoice: null };
		}

		const existing = (await this.billingRepository.listByPatient(patientId)) ?? [];
		const existingInvoice = existing.find((invoice) => {
			const charges = invoice?.charges ?? invoice?.getCharges?.() ?? [];
			return Array.isArray(charges)
				&& charges.some((line) => String(line?.appointmentId || '') === String(appointmentId));
		});

		if (existingInvoice) {
			return { created: false, invoice: existingInvoice };
		}

		const invoiceDetails = normalizeInvoiceDetails(inputInvoiceDetails);
		if (invoiceDetails) {
			if (!invoiceDetails.serviceName) {
				throw new DomainError('Invoice service name is required.');
			}
			if (!Number.isFinite(invoiceDetails.amount) || invoiceDetails.amount <= 0) {
				throw new DomainError('Invoice amount must be greater than 0.');
			}
		}

		const chargeLine = await this.resolveServiceCharge(reason, appointmentId, invoiceDetails);
		const dueDate =
			invoiceDetails?.dueDate
				?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const billing = new Billing({
			invoiceNumber: invoiceDetails?.invoiceNumber || buildInvoiceNumber(appointmentId),
			patientId,
			doctorId: appointment.getDoctorId?.() ?? appointment.doctorId ?? null,
			charges: [chargeLine],
			status: 'issued',
			dueDate,
			createdAt: new Date(),
		});

		const saved = await this.billingRepository.save(billing);
		return { created: true, invoice: saved ?? billing };
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
		let billingResult = { created: false, invoice: null };
		if (input.status === 'completed') {
			billingResult = await this.maybeCreateServiceBilling(appointment, input.invoiceDetails);
		}

		const invoice = billingResult?.invoice;
		const invoiceId = invoice?.id ?? invoice?.getId?.() ?? null;
		const invoiceNumber = invoice?.invoiceNumber ?? invoice?.getInvoiceNumber?.() ?? null;

		return new MarkAppointmentStatusOutput({
			appointmentId: appointment.id ?? appointment.getId?.() ?? input.appointmentId,
			status: appointment.getStatus?.() ?? appointment.status,
			billingCreated: Boolean(billingResult?.created),
			invoiceId,
			invoiceNumber,
		});
	}
}
