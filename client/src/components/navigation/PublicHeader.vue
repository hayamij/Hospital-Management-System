<template>
  <header class="public-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/">Hospital Management</RouterLink>

      <button type="button" class="hamburger" @click="isMenuOpen = !isMenuOpen" aria-label="Mở/đóng menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="right-zone" :class="{ open: isMenuOpen }">
        <nav class="menu">
          <RouterLink to="/" @click="closeMenu">Home</RouterLink>
          <RouterLink to="/services" @click="closeMenu">Dịch vụ</RouterLink>
          <RouterLink to="/doctors" @click="closeMenu">Bác sĩ</RouterLink>
          <RouterLink to="/news" @click="closeMenu">Tin tức</RouterLink>
          <RouterLink to="/about" @click="closeMenu">About</RouterLink>
        </nav>

        <div class="auth-zone">
          <template v-if="!auth.isAuthenticated">
            <RouterLink to="/login" class="action" @click="closeMenu">Đăng nhập</RouterLink>
            <RouterLink to="/register" class="action" @click="closeMenu">Đăng ký</RouterLink>
          </template>
          <template v-else-if="auth.role === 'patient'">
            <div class="avatar" :title="auth.email || 'Bệnh nhân'">{{ avatarInitial }}</div>
            <RouterLink to="/patient/dashboard" class="action" @click="closeMenu">Tổng quan của tôi</RouterLink>
            <RouterLink to="/patient/profile" class="action" @click="closeMenu">Hồ sơ của tôi</RouterLink>
            <button type="button" class="action" @click="handleLogout">Đăng xuất</button>
          </template>
          <template v-else>
            <RouterLink :to="auth.role === 'admin' ? '/admin/dashboard' : '/doctor/dashboard'" class="action" @click="closeMenu">Backoffice</RouterLink>
            <button type="button" class="action" @click="handleLogout">Đăng xuất</button>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const isMenuOpen = ref(false);

auth.fetchCurrentUser();

const avatarInitial = computed(() => {
  const source = auth.userProfile?.name || auth.email || 'P';
  return source.charAt(0).toUpperCase();
});

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleLogout = async () => {
  await auth.logout();
  closeMenu();
  router.push('/login');
};
</script>

<style scoped>
.public-header {
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #d1d5db;
}

.header-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  box-sizing: border-box;
}

.brand {
  font-weight: 700;
  color: #111827;
  text-decoration: none;
}

.hamburger {
  display: none;
  width: 44px;
  height: 44px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-direction: column;
}

.hamburger span {
  width: 18px;
  height: 2px;
  background: #111827;
}

.right-zone {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.menu {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.menu a {
  color: #111827;
  text-decoration: none;
  padding: 8px 6px;
}

.auth-zone {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid #9ca3af;
  background: #eef2ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #1f2937;
}

.action {
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  text-decoration: none;
  min-width: 122px;
  min-height: 40px;
  padding: 7px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  text-align: center;
  cursor: pointer;
}

@media (max-width: 900px) {
  .header-inner {
    align-items: center;
    padding: 12px 16px;
  }

  .hamburger {
    display: inline-flex;
    margin-left: auto;
  }

  .right-zone {
    width: 100%;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .right-zone.open {
    display: flex;
  }

  .menu,
  .auth-zone {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .menu a,
  .action {
    justify-content: center;
  }
}
</style>