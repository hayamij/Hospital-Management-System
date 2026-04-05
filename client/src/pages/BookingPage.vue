<template>
  <div class="booking-page">
    <BookingHeroSummary
      :selected-doctor-from-query="selectedDoctorFromQuery"
      :selected-service-name="selectedServiceName"
      :selected-slot-label="selectedSlotLabel"
      :form="booking.form"
      :selected-doctor="booking.selectedDoctor"
    />

    <BookingStepsPanel
      :step="booking.step"
      :form="booking.form"
      :selected-service-name="selectedServiceName"
      :specialties="booking.specialties"
      :available-doctors-for-selected-time="booking.availableDoctorsForSelectedTime"
      :selected-doctor="booking.selectedDoctor"
      :loading-doctors="booking.loadingDoctors"
      :loading-slots="booking.loadingSlots"
      :available-slots="booking.availableSlots"
      :empty-slot-message="emptySlotMessage"
      :selected-slot-label="selectedSlotLabel"
      :error="booking.error"
      :success-message="booking.successMessage"
      :submit-label="isPatientAccount ? 'Xac nhan tao lich' : 'Tiep tuc va nhap thong tin'"
      :submitting="booking.submitting"
      @specialty-change="booking.setSpecialty"
      @doctor-change="booking.setDoctor"
      @date-input="booking.setDate"
      @select-slot="booking.selectSlot"
      @clinical-symptoms-input="booking.form.clinicalSymptoms = $event"
      @go-back="booking.goBack"
      @go-next="booking.goNext"
      @submit="submit"
    />

    <div
      v-if="guestBookingOpen"
      class="guest-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-booking-title"
    >
      <div class="guest-modal panel">
        <h2 id="guest-booking-title">Hoan tat thong tin dat lich</h2>
        <p>
          Ban chua dang nhap tai khoan benh nhan. Vui long de lai thong tin, he thong se ghi nhan yeu cau
          va nhan vien se lien he xac nhan lich kham.
        </p>

        <form class="grid" @submit.prevent="submitGuestBooking">
          <label class="field">
            <span>Ho va ten</span>
            <input v-model.trim="guestBookingForm.fullName" type="text" placeholder="Nguyen Van A" required />
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model.trim="guestBookingForm.email" type="email" placeholder="user@example.com" required />
          </label>

          <label class="field">
            <span>So dien thoai</span>
            <input v-model.trim="guestBookingForm.phone" type="tel" placeholder="0901234567" required />
          </label>

          <label class="field">
            <span>Ghi chu them (tuy chon)</span>
            <textarea
              v-model.trim="guestBookingForm.note"
              rows="3"
              placeholder="Vi du: toi muon duoc goi sau 17h"
            ></textarea>
          </label>

          <p v-if="guestError" class="msg err">{{ guestError }}</p>

          <div class="modal-actions">
            <button type="button" :disabled="guestSubmitting" @click="closeGuestBookingForm">Dong</button>
            <button type="submit" class="primary" :disabled="guestSubmitting">
              {{ guestSubmitting ? 'Dang gui yeu cau...' : 'Gui yeu cau dat lich' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import BookingHeroSummary from '../components/booking/BookingHeroSummary.vue';
import BookingStepsPanel from '../components/booking/BookingStepsPanel.vue';
import { useBookingPageOrchestration } from '../composables/useBookingPageOrchestration.js';

const {
  booking,
  selectedServiceName,
  selectedSlotLabel,
  emptySlotMessage,
  selectedDoctorFromQuery,
  isPatientAccount,
  guestBookingOpen,
  guestBookingForm,
  guestSubmitting,
  guestError,
  closeGuestBookingForm,
  submitGuestBooking,
  submit,
} = useBookingPageOrchestration();
</script>

<style scoped>
.booking-page {
  display: grid;
  gap: 20px;
}

.guest-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.guest-modal {
  width: min(560px, 100%);
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #334155;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.primary {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}
</style>
