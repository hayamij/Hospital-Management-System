<template>
  <div class="page admin-staff-page">
    <header class="panel workspace-header">
      <div class="header-copy">
        <p class="eyebrow">ADMIN STAFF</p>
        <h1>Quản lý nhân sự</h1>
        <p>Quản lý tài khoản bác sĩ, bệnh nhân và quản trị viên bằng dữ liệu backend theo thời gian thực.</p>
      </div>

      <div class="header-actions">
        <RouterLink class="action-link" to="/admin/services">Đến quản lý dịch vụ</RouterLink>
        <RouterLink class="action-link" to="/admin/dashboard">Về dashboard</RouterLink>
      </div>
    </header>

    <UserManagement />
  </div>
</template>

<script setup>
import UserManagement from '../../components/admin/UserManagement.vue';
</script>

<style scoped>
.admin-staff-page {
  display: grid;
  gap: 18px;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

.header-copy h1 {
  margin: 8px 0 0;
  font-size: 34px;
}

.header-copy p {
  margin: 10px 0 0;
  color: #334155;
}

.header-actions {
  display: flex;
  gap: 10px;
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

@media (max-width: 1100px) {
  .header-copy h1 {
    font-size: 28px;
  }

  .action-link {
    width: 100%;
  }
}
</style>

