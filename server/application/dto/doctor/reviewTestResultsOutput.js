export class ReviewTestResultsOutput {
	constructor({ labResultId, reviewed, reviewedAt }) {
		this.labResultId = labResultId;
		this.reviewed = reviewed;
		this.reviewedAt = reviewedAt;
	}
}
