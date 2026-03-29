import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';
import { useBookingStore } from '../stores/booking.js';

export const useBookingPageOrchestration = () => {
  const route = useRoute();
  const booking = useBookingStore();
  const selectedServiceName = ref('');

  const selectedSlotLabel = computed(() => {
    const slot = booking.availableSlots.find((item) => item.start === booking.form.slotStart);
    return slot?.label || 'Chưa chọn';
  });

  const emptySlotMessage = computed(() => {
    if (!booking.slotsChecked) {
      return 'Chưa có khung giờ. Hãy chọn ngày và bấm Kiểm tra giờ trống.';
    }
    return 'Không tìm thấy khung giờ trống cho ngày này. Vui lòng thử ngày khác.';
  });

  const selectedDoctorFromQuery = computed(() => {
    const doctorId = String(route.query.doctor || '').trim();
    if (!doctorId) return '';
    const doc = booking.doctors.find((item) => item.id === doctorId);
    return doc?.name || doctorId;
  });

  const loadSlots = async () => {
    try {
      await booking.fetchAvailableSlots();
    } catch {
      // error is already stored in booking store
    }
  };

  const submit = async () => {
    try {
      await booking.submitAppointment();
    } catch {
      // error is already stored in booking store
    }
  };

  onMounted(async () => {
    booking.clearFeedback();
    await booking.initialize();

    const doctorFromQuery = String(route.query.doctor || '').trim();
    if (doctorFromQuery) {
      booking.setDoctor(doctorFromQuery);
    }

    const serviceFromQuery = String(route.query.service || '').trim();
    if (serviceFromQuery) {
      try {
        const publicInfo = await guestApi.publicInfo();
        const services = Array.isArray(publicInfo?.services) ? publicInfo.services : [];
        const matched = services.find((item) => String(item?.id || '').trim() === serviceFromQuery);
        selectedServiceName.value = matched?.name || serviceFromQuery;
        if (!booking.form.clinicalSymptoms.trim()) {
          booking.form.clinicalSymptoms = `Tư vấn và khám theo dịch vụ: ${selectedServiceName.value}.`;
        }
      } catch {
        selectedServiceName.value = serviceFromQuery;
      }
    }
  });

  return {
    booking,
    selectedServiceName,
    selectedSlotLabel,
    emptySlotMessage,
    selectedDoctorFromQuery,
    loadSlots,
    submit,
  };
};
