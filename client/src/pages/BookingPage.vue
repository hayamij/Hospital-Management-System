<template>
  <div class="booking-page">
    <BookingHeroSummary
      :selected-doctor-from-query="selectedDoctorFromQuery"
      :selected-service-name="selectedServiceName"
      :form="booking.form"
      :selected-doctor="booking.selectedDoctor"
    />

    <BookingStepsPanel
      :step="booking.step"
      :form="booking.form"
      :specialties="booking.specialties"
      :filtered-doctors="booking.filteredDoctors"
      :selected-doctor="booking.selectedDoctor"
      :loading-doctors="booking.loadingDoctors"
      :loading-slots="booking.loadingSlots"
      :available-slots="booking.availableSlots"
      :empty-slot-message="emptySlotMessage"
      :selected-slot-label="selectedSlotLabel"
      :error="booking.error"
      :success-message="booking.successMessage"
      :submitting="booking.submitting"
      @specialty-change="booking.setSpecialty"
      @doctor-change="booking.setDoctor"
      @date-input="booking.setDate"
      @load-slots="loadSlots"
      @select-slot="booking.selectSlot"
      @clinical-symptoms-input="booking.form.clinicalSymptoms = $event"
      @go-back="booking.goBack"
      @go-next="booking.goNext"
      @submit="submit"
    />
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
  loadSlots,
  submit,
} = useBookingPageOrchestration();
</script>

<style scoped>
.booking-page {
  display: grid;
  gap: 20px;
}
</style>
