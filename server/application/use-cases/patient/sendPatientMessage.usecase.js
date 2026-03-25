import { DomainError } from '../../../domain/exceptions/domainError.js';
import { SendPatientMessageInput } from '../../dto/patient/sendPatientMessageInput.js';
import { SendPatientMessageOutput } from '../../dto/patient/sendPatientMessageOutput.js';

export class SendPatientMessageUseCase {
	constructor({ patientRepository, doctorRepository, messageRepository, notificationService }) {
		this.patientRepository = patientRepository;
		this.doctorRepository = doctorRepository;
		this.messageRepository = messageRepository;
		this.notificationService = notificationService;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof SendPatientMessageInput ? inputDto : new SendPatientMessageInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.message || !String(input.message).trim()) {
			throw new DomainError('Message content is required.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const messagePayload = {
			fromPatientId: input.patientId,
			toDoctorId: input.doctorId,
			subject: input.subject ? String(input.subject).trim() : undefined,
			content: String(input.message).trim(),
			createdAt: new Date(),
		};

		const created = await this.messageRepository.create(messagePayload);
		const messageId = created?.id ?? created?.messageId ?? created ?? null;
		const sentAt = created?.createdAt ?? messagePayload.createdAt;

		if (this.notificationService?.sendNotification) {
			await this.notificationService.sendNotification({
				recipientId: input.doctorId,
				channel: 'in_app',
				subject: messagePayload.subject || 'New message from patient',
				message: messagePayload.content,
			});
		}

		return new SendPatientMessageOutput({ messageId, status: 'sent', sentAt });
	}
}
