import { onMounted, reactive, ref } from 'vue';
import { guestApi } from '../services/api.js';

const fallbackDoctors = [
  { id: 'doc-1', fullName: 'BS. Minh họa', specialization: 'Nội tổng quát' },
  { id: 'doc-2', fullName: 'BS. Alice', specialization: 'Tim mạch' },
  { id: 'doc-3', fullName: 'BS. Minh', specialization: 'Nhi khoa' },
];

const fallbackSpecialties = [
  { id: 'sp-1', name: 'Nội tổng quát', summary: 'Khám tổng quát, tầm soát và theo dõi sức khỏe định kỳ.' },
  { id: 'sp-2', name: 'Tim mạch', summary: 'Chẩn đoán và điều trị các vấn đề tim mạch phổ biến.' },
  { id: 'sp-3', name: 'Nhi khoa', summary: 'Chăm sóc sức khỏe toàn diện cho trẻ em mọi lứa tuổi.' },
  { id: 'sp-4', name: 'Sản phụ khoa', summary: 'Đồng hành cùng sức khỏe phụ nữ và thai kỳ an toàn.' },
  { id: 'sp-5', name: 'Xét nghiệm', summary: 'Hỗ trợ chẩn đoán nhanh với hệ thống xét nghiệm hiện đại.' },
  { id: 'sp-6', name: 'Cấp cứu', summary: 'Xử lý tình huống khẩn cấp 24/7 với đội ngũ trực liên tục.' },
];

const newsItems = [
  { id: 'outpatient-expand', date: '2026-03-24', title: 'Mở rộng khu khám ngoại trú', summary: 'Tăng số quầy tiếp nhận và tối ưu thời gian chờ của bệnh nhân.' },
  { id: 'new-specialists', date: '2026-03-20', title: 'Bổ sung đội ngũ bác sĩ chuyên khoa', summary: 'Thêm bác sĩ tim mạch, nhi khoa và nội tổng quát tuần này.' },
  { id: 'online-queue', date: '2026-03-15', title: 'Ra mắt thông báo hàng đợi trực tuyến', summary: 'Người bệnh có thể theo dõi thứ tự khám ngay trên hệ thống.' },
];

export const useHomePageOrchestration = () => {
  const doctors = ref([]);
  const specialties = ref([...fallbackSpecialties]);
  const error = ref('');
  const search = reactive({ query: '', specialty: '' });

  const specialtyLink = (item) => ({
    path: '/doctors',
    query: { specialty: item?.name || '' },
  });

  const safeRun = async (fn) => {
    error.value = '';
    try {
      await fn();
    } catch (e) {
      error.value = e?.message || 'Không thể tải dữ liệu từ hệ thống.';
    }
  };

  const hydrateSpecialties = () =>
    safeRun(async () => {
      const info = await guestApi.publicInfo();
      const mapped = (info?.services || []).map((svc) => ({
        id: svc.id || `sp-${svc.name || 'unknown'}`,
        name: svc.name || 'Chuyên khoa',
        summary: svc.description || 'Thông tin chuyên khoa đang được cập nhật.',
      }));

      if (mapped.length > 0) {
        specialties.value = mapped;
      }
    });

  const searchDoctors = () =>
    safeRun(async () => {
      const response = await guestApi.searchDoctors(search);
      doctors.value = (response?.doctors && response.doctors.length > 0)
        ? response.doctors
        : [...fallbackDoctors];
    });

  onMounted(() => {
    doctors.value = [...fallbackDoctors];
    hydrateSpecialties();
    searchDoctors();
  });

  return {
    doctors,
    specialties,
    error,
    search,
    newsItems,
    specialtyLink,
    searchDoctors,
  };
};
