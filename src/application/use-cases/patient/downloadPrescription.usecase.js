import { DomainError } from '../../../domain/exceptions/domainError.js';
import { DownloadPrescriptionInput } from '../../dto/patient/downloadPrescriptionInput.js';
import { DownloadPrescriptionOutput } from '../../dto/patient/downloadPrescriptionOutput.js';

export class DownloadPrescriptionUseCase {
	constructor({ patientRepository, prescriptionRepository }) {
		this.patientRepository = patientRepository;
		this.prescriptionRepository = prescriptionRepository;
	}

	async execute(inputDto) {
		const input =
			inputDto instanceof DownloadPrescriptionInput
				? inputDto
				: new DownloadPrescriptionInput(inputDto ?? {});

		if (!input.patientId) {
			throw new DomainError('Patient id is required.');
		}
		if (!input.prescriptionId) {
			throw new DomainError('Prescription id is required.');
		}

		const patient = await this.patientRepository.findById(input.patientId);
		if (!patient) {
			throw new DomainError('Patient not found.');
		}

		const prescription = await this.prescriptionRepository.findById(input.prescriptionId);
		if (!prescription) {
			throw new DomainError('Prescription not found.');
		}

		const prescriptionPatientId = prescription.patientId ?? prescription.getPatientId?.();
		if (prescriptionPatientId && prescriptionPatientId !== input.patientId) {
			throw new DomainError('Prescription does not belong to patient.');
		}

		const content = prescription.content ?? prescription;
		return new DownloadPrescriptionOutput({
			prescriptionId: prescription.id ?? prescription.getId?.() ?? input.prescriptionId,
			content,
		});
	}
}
