<template>
  <div class="page">
    <header class="panel">
      <h1>Vận hành quản trị</h1>
      <p>Thực thi các tác vụ quản trị: người dùng, lịch, thanh toán, dịch vụ, thiết lập, báo cáo và kiểm tra.</p>
    </header>

    <UserManagement />

    <section class="panel">
      <h2>Lịch bác sĩ và điều chỉnh lịch hẹn</h2>
      <form class="grid four" @submit.prevent="$emit('update-doctor-schedule')">
        <input v-model="scheduleOps.doctorId" placeholder="Mã bác sĩ" required />
        <input v-model.number="scheduleOps.slotsPerDay" type="number" min="0" placeholder="Số ca mỗi ngày" required />
        <button type="submit">Cập nhật lịch bác sĩ</button>
      </form>
      <form class="grid five" @submit.prevent="$emit('override-appointment')">
        <input v-model="overrideOps.appointmentId" placeholder="Mã lịch hẹn" required />
        <input v-model="overrideOps.action" placeholder="Hành động (reschedule/cancel/assignDoctor)" required />
        <input v-model="overrideOps.startAt" type="datetime-local" />
        <input v-model="overrideOps.endAt" type="datetime-local" />
        <input v-model="overrideOps.doctorId" placeholder="Mã bác sĩ (tùy chọn)" />
        <button type="submit">Điều chỉnh lịch hẹn</button>
      </form>
    </section>

    <section class="panel">
      <h2>Dịch vụ, thiết lập và báo cáo</h2>
      <form class="grid four" @submit.prevent="$emit('upsert-service')">
        <input v-model="serviceOps.id" placeholder="Mã dịch vụ" />
        <input v-model="serviceOps.name" placeholder="Tên dịch vụ" required />
        <input v-model.number="serviceOps.price" type="number" min="0" placeholder="Giá" required />
        <button type="submit">Cập nhật dịch vụ</button>
      </form>
      <form class="grid three" @submit.prevent="$emit('update-settings')">
        <input v-model="settingsOps.clinicName" placeholder="Tên cơ sở" required />
        <input v-model="settingsOps.timezone" placeholder="Múi giờ" required />
        <button type="submit">Cập nhật thiết lập</button>
      </form>
      <form class="grid three" @submit.prevent="$emit('run-report')">
        <input v-model="reportOps.reportName" placeholder="Tên báo cáo" required />
        <input v-model="reportOps.from" type="date" />
        <input v-model="reportOps.to" type="date" />
        <button type="submit">Chạy báo cáo</button>
      </form>
      <pre class="pre">{{ prettyReport(reportResult) }}</pre>
    </section>

    <section class="panel">
      <h2>Thanh toán và kiểm tra bệnh án</h2>
      <form class="grid four" @submit.prevent="$emit('manage-billing')">
        <input v-model="billingOps.invoiceId" placeholder="Mã hóa đơn" required />
        <input v-model="billingOps.action" placeholder="Hành động (issue/markPaid/void)" required />
        <input v-model="billingOps.dueDate" type="date" />
        <button type="submit">Áp dụng thanh toán</button>
      </form>
      <form class="grid three" @submit.prevent="$emit('audit-record')">
        <input v-model="auditOps.recordId" placeholder="Mã bệnh án" required />
        <input v-model="auditOps.action" placeholder="Hành động (approve/reject)" required />
        <input v-model="auditOps.reason" placeholder="Lý do" />
        <button type="submit">Gửi kiểm tra</button>
      </form>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import UserManagement from './UserManagement.vue';

defineProps({
  scheduleOps: { type: Object, required: true },
  overrideOps: { type: Object, required: true },
  serviceOps: { type: Object, required: true },
  settingsOps: { type: Object, required: true },
  reportOps: { type: Object, required: true },
  billingOps: { type: Object, required: true },
  auditOps: { type: Object, required: true },
  reportResult: { type: [Object, Array, String, Number, Boolean], default: null },
  status: { type: String, default: '' },
  error: { type: String, default: '' },
  prettyReport: { type: Function, required: true },
});

defineEmits([
  'update-doctor-schedule',
  'override-appointment',
  'upsert-service',
  'update-settings',
  'run-report',
  'manage-billing',
  'audit-record',
]);
</script>

<style scoped>
.four { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.five { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.pre { border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; max-height: 320px; overflow: auto; }
</style>
