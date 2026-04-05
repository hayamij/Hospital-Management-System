import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';
import { readAuthPrefill, writeAuthPrefill } from '../services/sessionStorage.js';
import { useAuthStore } from '../stores/auth.js';
import { useBookingStore } from '../stores/booking.js';

const SERVICE_SPECIALTY_HINTS = [
  { keywords: ['pediatric', 'children', 'nhi'], specialtyHints: ['pediatric', 'nhi'] },
  { keywords: ['cardio', 'ecg', 'tim'], specialtyHints: ['cardio', 'tim'] },
  { keywords: ['derma', 'skin', 'da lieu'], specialtyHints: ['derma', 'da lieu', 'skin'] },
  { keywords: ['oncology', 'cancer', 'ung thu'], specialtyHints: ['oncology', 'ung thu', 'cancer'] },
  { keywords: ['kidney', 'nephro', 'than'], specialtyHints: ['nephro', 'kidney', 'than'] },
  { keywords: ['eye', 'vision', 'ophthal', 'mat'], specialtyHints: ['ophthal', 'eye', 'vision', 'mat'] },
  { keywords: ['ent', 'tai mui hong'], specialtyHints: ['ent', 'tai mui hong'] },
  { keywords: ['psy', 'mental', 'tam ly'], specialtyHints: ['psy', 'mental', 'tam ly'] },
  { keywords: ['rehab', 'therapy', 'physical'], specialtyHints: ['rehab', 'sports', 'ortho', 'physical'] },
  { keywords: ['pulmonary', 'respiratory', 'phoi'], specialtyHints: ['pulmo', 'respiratory', 'phoi'] },
];

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const includesAny = (text, candidates = []) => candidates.some((item) => text.includes(item));

const getTodayDateInput = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const findSuggestedSpecialty = ({ serviceName, specialties = [], doctors = [] }) => {
  const normalizedService = normalizeText(serviceName);
  if (!normalizedService) return '';

  const directMatch = specialties.find((specialty) => normalizedService.includes(normalizeText(specialty)));
  if (directMatch) return directMatch;

  for (const rule of SERVICE_SPECIALTY_HINTS) {
    if (!includesAny(normalizedService, rule.keywords)) continue;

    const specialtyMatch = specialties.find((specialty) =>
      includesAny(normalizeText(specialty), rule.specialtyHints)
    );
    if (specialtyMatch) return specialtyMatch;
    
    const doctorMatch = doctors.find((doctor) => {
      const doctorContext = normalizeText(`${doctor.specialty} ${doctor.department || ''}`);
      return includesAny(doctorContext, rule.specialtyHints);
    });

    if (doctorMatch?.specialty) {
      return doctorMatch.specialty;
    }
  }

  return '';
};

export const useBookingPageOrchestration = () => {
  const route = useRoute();
  const auth = useAuthStore();
  const booking = useBookingStore();
  const selectedServiceName = ref('');
  const guestBookingOpen = ref(false);
  const guestSubmitting = ref(false);
  const guestError = ref('');

  const guestForm = reactive({
    fullName: '',
    email: '',
    phone: '',
    note: '',
  });

  const phoneRegex = /^(\+?84|0)(3|5|7|8|9)\d{8}$/;
  const isPatientAccount = computed(() => auth.isAuthenticated && auth.role === 'patient');

  const selectedSlotLabel = computed(() => {
    const slot = booking.availableSlots.find(
      (item) => item.start === booking.form.slotStart && item.end === booking.form.slotEnd
    );
    return slot?.timeLabel || 'Chưa chọn';
  });

  const emptySlotMessage = computed(() => {
    if (!booking.form.appointmentDate) {
      return 'Vui lòng chọn ngày khám, hệ thống sẽ tự động gợi ý khung giờ trống.';
    }
    if (!booking.slotsChecked) {
      return 'Đang chuẩn bị danh sách khung giờ trống cho bạn...';
    }
    return 'Không tìm thấy khung giờ trống cho ngày này. Vui lòng thử ngày khác.';
  });

  const selectedDoctorFromQuery = computed(() => {
    const doctorId = String(route.query.doctor || '').trim();
    if (!doctorId) return '';
    const doc = booking.doctors.find((item) => item.id === doctorId);
    return doc?.name || doctorId;
  });

  const applyServiceAutofill = async () => {
    const serviceFromQuery = String(route.query.service || '').trim();
    const serviceNameFromQuery = String(route.query.serviceName || '').trim();

    if (!serviceFromQuery && !serviceNameFromQuery) {
      return;
    }

    if (serviceNameFromQuery) {
      selectedServiceName.value = serviceNameFromQuery;
    }

    if (!selectedServiceName.value && serviceFromQuery) {
      try {
        const detail = await guestApi.getServiceDetail(serviceFromQuery);
        selectedServiceName.value = String(detail?.service?.name || detail?.name || serviceFromQuery).trim();
      } catch {
        selectedServiceName.value = serviceFromQuery;
      }
    }

    const suggestedSpecialty = findSuggestedSpecialty({
      serviceName: selectedServiceName.value,
      specialties: booking.specialties,
      doctors: booking.doctors,
    });

    if (suggestedSpecialty && !booking.form.specialty) {
      booking.setSpecialty(suggestedSpecialty);
    }

    if (!booking.form.clinicalSymptoms.trim() && selectedServiceName.value) {
      booking.form.clinicalSymptoms = `Tôi muốn khám theo dịch vụ: ${selectedServiceName.value}. Vui lòng tư vấn thêm.`;
    }
  };

  const loadSlots = async () => {
    try {
      await booking.fetchAvailableSlots();
    } catch {
      // error is already stored in booking store
    }
  };

  const openGuestBookingForm = () => {
    const prefill = readAuthPrefill() || {};
    guestForm.fullName = prefill.fullName || auth.userProfile?.name || '';
    guestForm.email = prefill.email || auth.email || '';
    guestForm.phone = prefill.phone || '';
    guestForm.note = '';
    guestError.value = '';
    guestBookingOpen.value = true;
  };

  const closeGuestBookingForm = () => {
    if (guestSubmitting.value) return;
    guestBookingOpen.value = false;
    guestError.value = '';
  };

  const buildGuestContactMessage = () => {
    const parts = [
      'Yeu cau dat lich tu khach:',
      `- Dich vu: ${selectedServiceName.value || 'Chua xac dinh'}`,
      `- Chuyen khoa: ${booking.form.specialty || 'Chua chon'}`,
      `- Bac si: ${booking.selectedDoctor?.name || 'Chua chon'}`,
      `- Ngay kham: ${booking.form.appointmentDate || 'Chua chon'}`,
      `- Khung gio: ${selectedSlotLabel.value || 'Chua chon'}`,
      `- Trieu chung: ${booking.form.clinicalSymptoms || 'Chua nhap'}`,
    ];

    if (guestForm.note.trim()) {
      parts.push(`- Ghi chu them: ${guestForm.note.trim()}`);
    }

    return parts.join('\n');
  };

  const submitGuestBooking = async () => {
    if (booking.step !== 4) {
      booking.error = 'Vui long hoan thanh day du cac buoc dat lich truoc khi gui yeu cau.';
      return;
    }

    guestError.value = '';

    if (!guestForm.fullName.trim()) {
      guestError.value = 'Vui long nhap ho ten.';
      return;
    }
    if (!guestForm.email.trim()) {
      guestError.value = 'Vui long nhap email.';
      return;
    }
    if (!guestForm.phone.trim() || !phoneRegex.test(guestForm.phone.trim())) {
      guestError.value = 'So dien thoai khong hop le (vi du: 0901234567).';
      return;
    }

    guestSubmitting.value = true;
    try {
      await guestApi.startRegistration({
        fullName: guestForm.fullName.trim(),
        email: guestForm.email.trim(),
        phone: guestForm.phone.trim(),
      });

      await guestApi.contact({
        name: guestForm.fullName.trim(),
        email: guestForm.email.trim(),
        message: buildGuestContactMessage(),
      });

      writeAuthPrefill({
        fullName: guestForm.fullName.trim(),
        email: guestForm.email.trim(),
        identifier: guestForm.email.trim(),
        phone: guestForm.phone.trim(),
      });

      booking.error = '';
      booking.successMessage = 'Yeu cau dat lich da duoc ghi nhan. Bo phan cham soc khach hang se lien he de xac nhan lich kham.';
      guestBookingOpen.value = false;
    } catch (error) {
      guestError.value = error?.message || 'Khong the gui yeu cau dat lich. Vui long thu lai.';
    } finally {
      guestSubmitting.value = false;
    }
  };

  const submit = async () => {
    if (isPatientAccount.value) {
      try {
        await booking.submitAppointment();
      } catch {
        // error is already stored in booking store
      }
      return;
    }

    openGuestBookingForm();
  };

  onMounted(async () => {
    booking.clearFeedback();
    await booking.initialize();

    await applyServiceAutofill();

    const doctorFromQuery = String(route.query.doctor || '').trim();
    if (doctorFromQuery) {
      booking.setDoctor(doctorFromQuery);
    }

    if (!booking.form.appointmentDate) {
      booking.form.appointmentDate = getTodayDateInput();
    }

    await loadSlots();

    if (doctorFromQuery && booking.availableSlots.some((slot) => slot.doctors?.some((doctor) => doctor.id === doctorFromQuery))) {
      booking.setDoctor(doctorFromQuery);
    }
  });

  return {
    booking,
    selectedServiceName,
    selectedSlotLabel,
    emptySlotMessage,
    selectedDoctorFromQuery,
    isPatientAccount,
    guestBookingOpen,
    guestBookingForm: guestForm,
    guestSubmitting,
    guestError,
    closeGuestBookingForm,
    submitGuestBooking,
    loadSlots,
    submit,
  };
};
