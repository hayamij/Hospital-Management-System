<template>
  <div class="admin-ops page">
    <header class="panel ops-header">
      <div class="ops-copy">
        <p class="eyebrow">ADMIN WORKSPACE</p>
        <h1>Vận hành quản trị</h1>
        <p>
          Điều phối nhân sự, lịch, dịch vụ, tài chính và kiểm tra hồ sơ trong một màn hình thao tác tập trung.
        </p>
      </div>

      <div class="ops-actions">
        <RouterLink class="action-link" to="/admin/dashboard">Về dashboard</RouterLink>
        <RouterLink class="action-link" to="/admin/patients">Mở quản lý bệnh nhân</RouterLink>
      </div>
    </header>

    <section id="staff" class="ops-embed">
      <UserManagement />
    </section>

    <section class="ops-grid">
      <article class="panel ops-card">
        <header class="card-head">
          <div class="card-title-row">
            <span class="card-icon" aria-hidden="true">SC</span>
            <div>
              <h2>Lịch bác sĩ và điều chỉnh lịch hẹn</h2>
              <p>Điều chỉnh slot làm việc và thao tác nhanh với lịch hẹn phát sinh.</p>
            </div>
          </div>
        </header>

        <form class="grid four" @submit.prevent="$emit('update-doctor-schedule')">
          <input v-model="scheduleOps.doctorId" placeholder="Mã bác sĩ" required />
          <input
            v-model.number="scheduleOps.slotsPerDay"
            type="number"
            min="0"
            placeholder="Số ca mỗi ngày"
            required
          />
          <button type="submit">Cập nhật lịch bác sĩ</button>
        </form>

        <form class="grid five" @submit.prevent="$emit('override-appointment')">
          <input v-model="overrideOps.appointmentId" placeholder="Mã lịch hẹn" required />
          <input
            v-model="overrideOps.action"
            placeholder="Hành động (reschedule/cancel/assignDoctor)"
            required
          />
          <input v-model="overrideOps.startAt" type="datetime-local" />
          <input v-model="overrideOps.endAt" type="datetime-local" />
          <input v-model="overrideOps.doctorId" placeholder="Mã bác sĩ (tùy chọn)" />
          <button type="submit">Điều chỉnh lịch hẹn</button>
        </form>
      </article>

      <article id="services" class="panel ops-card">
        <header class="card-head">
          <div class="card-title-row">
            <span class="card-icon" aria-hidden="true">SV</span>
            <div>
              <h2>Dịch vụ, thiết lập và báo cáo</h2>
              <p>Quản lý danh mục dịch vụ và tạo báo cáo theo mốc thời gian.</p>
            </div>
          </div>
        </header>

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

        <pre class="pre report-box">{{ prettyReport(reportResult) }}</pre>
      </article>
    </section>

    <section class="panel ops-card">
      <header class="card-head">
        <div class="card-title-row">
          <span class="card-icon" aria-hidden="true">FN</span>
          <div>
            <h2>Thanh toán và kiểm tra bệnh án</h2>
            <p>Xử lý chu trình hóa đơn và kiểm tra hồ sơ bệnh án từ khu vực tập trung.</p>
          </div>
        </div>
      </header>

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

    <section class="panel status-strip" v-if="status || error">
      <p v-if="status" class="msg ok">{{ status }}</p>
      <p v-if="error" class="msg err">{{ error }}</p>
    </section>
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
.admin-ops {
  display: grid;
  gap: 24px;
}

.ops-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
}

.ops-copy h1 {
  margin: 8px 0 0;
  font-size: 34px;
}

.ops-copy p {
  margin: 10px 0 0;
  color: #334155;
}

.ops-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-link {
  min-height: 44px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #111827;
  text-decoration: none;
}

.ops-embed {
  min-width: 0;
}

.ops-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.ops-card {
  background: #ffffff;
  display: grid;
  gap: 14px;
}

.card-head {
  margin: 0;
}

.card-title-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.card-icon {
  width: 40px;
  height: 40px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.08em;
}

.card-head h2 {
  margin: 0;
}

.card-head p {
  margin: 6px 0 0;
  color: #475569;
}

.ops-card .grid {
  margin: 0;
  gap: 14px;
}

.ops-card button {
  min-height: 44px;
}

.four { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.five { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.pre { border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; max-height: 320px; overflow: auto; }

.report-box {
  margin-top: 12px;
}

.status-strip {
  display: grid;
  gap: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.status-strip .msg {
  margin: 0;
}

@media (max-width: 1300px) {
  .ops-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .ops-copy h1 {
    font-size: 28px;
  }

  .ops-actions,
  .action-link {
    width: 100%;
  }
}
</style>
