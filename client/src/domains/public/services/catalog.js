const SERVICE_IMAGES = [
  '/assets/images/banner2.png',
  '/assets/images/hospital.png',
  '/assets/images/hospital2.png',
  '/assets/images/room.png',
  '/assets/images/room2.png',
  '/assets/images/doctor-image.png',
  '/assets/images/image.png',
];

const FALLBACK_SERVICES = [
  {
    id: 'svc-fallback-1',
    name: 'Kham tong quat',
    category: 'Tong quat',
    description: 'Kham suc khoe dinh ky va tu van tong quan.',
    price: 300000,
  },
  {
    id: 'svc-fallback-2',
    name: 'Kham tim mach',
    category: 'Noi khoa',
    description: 'Tam soat va theo doi benh ly tim mach pho bien.',
    price: 450000,
  },
  {
    id: 'svc-fallback-3',
    name: 'Kham nhi khoa',
    category: 'Nhi khoa',
    description: 'Cham soc suc khoe cho tre em theo tung do tuoi.',
    price: 350000,
  },
  {
    id: 'svc-fallback-4',
    name: 'Xet nghiem tong hop',
    category: 'Can lam sang',
    description: 'Goi xet nghiem co ban phuc vu chan doan ban dau.',
    price: 500000,
  },
];

export const categoryByName = (name = '') => {
  const text = String(name).toLowerCase();
  if (text.includes('tim mach') || text.includes('noi')) return 'Noi khoa';
  if (text.includes('nhi')) return 'Nhi khoa';
  if (text.includes('xet nghiem') || text.includes('chan doan')) return 'Can lam sang';
  if (text.includes('ngoai') || text.includes('phau thuat')) return 'Ngoai khoa';
  return 'Tong quat';
};

const mapService = (item, index) => ({
  id: item?.id || `service-${index + 1}`,
  name: item?.name || item?.title || 'Dich vu',
  category: item?.category || categoryByName(item?.name || item?.title || ''),
  description: item?.description || '',
  price: item?.price ?? null,
  image: SERVICE_IMAGES[index % SERVICE_IMAGES.length],
});

export const getFallbackServices = () =>
  FALLBACK_SERVICES.map((item, index) => ({
    ...item,
    category: item.category || categoryByName(item.name),
    image: SERVICE_IMAGES[index % SERVICE_IMAGES.length],
  }));

export const loadCatalogServices = async (guestApi) => {
  const response = await guestApi.publicInfo();
  const apiServices = Array.isArray(response?.services) ? response.services : [];

  if (apiServices.length === 0) {
    return getFallbackServices();
  }

  return apiServices.map(mapService);
};

export const formatPrice = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return `${amount.toLocaleString('vi-VN')} VND`;
};
