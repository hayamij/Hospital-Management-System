export const prettyReport = (value) =>
  value ? JSON.stringify(value, null, 2) : 'No report generated yet.';

export const withFeedback = async ({ run, setStatus, setError, successText }) => {
  setError('');
  setStatus('');

  try {
    await run();
    setStatus(successText);
  } catch (error) {
    setError(error?.message || 'Operation failed.');
  }
};

export const buildOverridePayload = (overrideOps, adminId) => ({
  action: overrideOps.action,
  startAt: overrideOps.startAt || undefined,
  endAt: overrideOps.endAt || undefined,
  doctorId: overrideOps.doctorId || undefined,
  adminId,
});

export const buildServicePayload = (serviceOps, adminId) => ({
  action: 'upsert',
  adminId,
  service: {
    id: serviceOps.id || undefined,
    name: serviceOps.name,
    price: serviceOps.price,
  },
});

export const buildBillingPayload = (billingOps, adminId) => ({
  action: billingOps.action,
  dueDate: billingOps.dueDate || undefined,
  adminId,
});
