export const mapDoctorScheduleItems = (appointments = []) => {
  return appointments.map((item, index) => ({
    id: item.id || item.appointmentId || `appointment-${index + 1}`,
    patientId: item.patientId || item.patient?.id || '',
    reason: item.reason || 'Lịch khám',
    startAt: item.startAt || '-',
    endAt: item.endAt || '-',
    status: item.status || '-',
  }));
};
