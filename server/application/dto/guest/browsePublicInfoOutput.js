export class BrowsePublicInfoOutput {
	constructor({ services, insurancePlans = [], bookingConstraints = [], hospitalInfo }) {
		this.services = services;
		this.insurancePlans = insurancePlans;
		this.bookingConstraints = bookingConstraints;
		this.hospitalInfo = hospitalInfo;
	}
}
