const DETAIL_IMAGES = [
  '/assets/images/hospital2.png',
  '/assets/images/room2.png',
  '/assets/images/doctor-image.png',
  '/assets/images/hospital.png',
  '/assets/images/banner2.png',
  '/assets/images/image.png',
];

export const normalizeService = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source =
    payload.service && typeof payload.service === 'object'
      ? payload.service
      : payload;

  if (!source || typeof source !== 'object') {
    return null;
  }

  return {
    id: source.id || null,
    name: source.name || source.title || '',
    description: source.description || '',
    price: source.price ?? null,
    image:
      source.image ||
      DETAIL_IMAGES[
        Math.abs(String(source.id || source.name || '').length) %
          DETAIL_IMAGES.length
      ],
  };
};

export const mapRelatedServices = (services) =>
  (services || []).map((item, index) => ({
    id: item?.id || `svc-${index + 1}`,
    name: item?.name || item?.title || 'Service',
    description: item?.description || '',
    price: item?.price ?? null,
    image: DETAIL_IMAGES[index % DETAIL_IMAGES.length],
  }));

export const buildBookingLink = (serviceId) => {
  if (!serviceId) return '/register';
  return `/patient/booking?service=${encodeURIComponent(serviceId)}`;
};

export const formatPrice = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return `${amount.toLocaleString('vi-VN')} VND`;
};
