export const formatDoctorStatus = (status) => {
  const map = {
    active: 'Đang hoạt động',
    on_leave: 'Đang nghỉ phép',
    inactive: 'Ngưng hoạt động',
  };
  return map[status] || status || '-';
};

export const createDoctorProfilePageActions = ({ auth, doctorProfile }) => {
  const restoreDefaults = () => {
    doctorProfile.restoreDefaults();
  };

  const reloadProfile = async () => {
    try {
      await doctorProfile.loadProfile();
    } catch {
      doctorProfile.restoreDefaults();
    }
  };

  const submitProfile = async () => {
    try {
      await doctorProfile.updateProfile();
    } catch {
      // Error state is handled in store.
    }
  };

  const initializePage = async () => {
    await auth.fetchCurrentUser();
    await reloadProfile();
  };

  return {
    restoreDefaults,
    reloadProfile,
    submitProfile,
    initializePage,
  };
};
