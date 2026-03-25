export class DownloadPrescriptionInput {
	constructor({ patientId, prescriptionId }) {
		this.patientId = patientId;
		this.prescriptionId = prescriptionId;
	}
}
