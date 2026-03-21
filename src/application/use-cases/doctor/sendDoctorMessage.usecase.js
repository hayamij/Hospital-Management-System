import { DomainError } from '../../../domain/exceptions/domainError.js';
import { SendDoctorMessageInput } from '../../dto/doctor/sendDoctorMessageInput.js';
import { SendDoctorMessageOutput } from '../../dto/doctor/sendDoctorMessageOutput.js';

export class SendDoctorMessageUseCase {
	constructor({ doctorRepository, patientRepository, messageRepository, notificationService }) {
		this.doctorRepository = doctorRepository;
		this.patientRepository = patientRepository;
		this.messageRepository = messageRepository;
		this.notificationService = notificationService;
	}

	async execute(inputDto) {
		const input = inputDto instanceof SendDoctorMessageInput ? inputDto : new SendDoctorMessageInput(inputDto);

		if (!input.doctorId) {
			throw new DomainError('Doctor id is required.');
		}
		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.content || !String(input.content).trim()) {
			throw new DomainError('Message content is required.');
		}

		const doctor = await this.doctorRepository.findById(input.doctorId);
		if (!doctor) {
			throw new DomainError('Doctor not found.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const message = {
			fromDoctorId: input.doctorId,
			toPatientId: input.patientId,
			content: String(input.content).trim(),
			createdAt: new Date(),
		};

		const created = await this.messageRepository.create(message);
		const messageId = created?.id ?? created?.messageId ?? created ?? null;

		if (this.notificationService?.sendNotification) {
			await this.notificationService.sendNotification({
				recipientId: input.patientId,
				channel: 'in_app',
				subject: 'New message from your doctor',
				message: message.content,
			});
		}

		return new SendDoctorMessageOutput({ messageId, delivered: true });
	}
}
