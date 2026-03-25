import { DomainError } from '../../../domain/exceptions/domainError.js';
import { SubmitContactFormInput } from '../../dto/guest/submitContactFormInput.js';
import { SubmitContactFormOutput } from '../../dto/guest/submitContactFormOutput.js';

export class SubmitContactFormUseCase {
	constructor({ contactLeadRepository }) {
		this.contactLeadRepository = contactLeadRepository;
	}

	async execute(inputDto) {
		const input = inputDto instanceof SubmitContactFormInput ? inputDto : new SubmitContactFormInput(inputDto);

		if (!input.name || !String(input.name).trim()) {
			throw new DomainError('Name is required.');
		}
		if (!input.email || !String(input.email).trim()) {
			throw new DomainError('Email is required.');
		}
		if (!input.message || !String(input.message).trim()) {
			throw new DomainError('Message is required.');
		}

		const lead = {
			name: String(input.name).trim(),
			email: String(input.email).trim(),
			message: String(input.message).trim(),
			status: 'pending',
			createdAt: new Date(),
		};

		const created = await this.contactLeadRepository.create(lead);
		const leadId = created?.id ?? created?.leadId ?? created;

		return new SubmitContactFormOutput({ success: true, leadId });
	}
}
