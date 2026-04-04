<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/">Hospital Management</RouterLink>

      <button type="button" class="hamburger" @click="isMenuOpen = !isMenuOpen" aria-label="Mở/đóng menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="right-zone" :class="{ open: isMenuOpen }">
        <nav class="menu">
          <RouterLink
            v-for="item in publicLinks"
            :key="item.to"
            :to="item.to"
            @click="closeMenu"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="auth-zone">
          <template v-if="!auth.isAuthenticated">
            <RouterLink :to="AUTH_ROUTE.login" class="action" @click="closeMenu">Đăng nhập</RouterLink>
            <RouterLink :to="AUTH_ROUTE.register" class="action" @click="closeMenu">Đăng ký</RouterLink>
          </template>
          <template v-else>
            <p class="identity" v-if="auth.email">{{ auth.email }}</p>
            <RouterLink :to="dashboardRoute" class="action primary" @click="closeMenu">{{ roleLabel }}</RouterLink>
            <RouterLink v-if="isPatient" to="/patient/profile" class="action" @click="closeMenu">Hồ sơ</RouterLink>
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
import { useRoleVisibility } from '../../composables/useRoleVisibility.js';
import {
  AUTH_ROUTE,
  getRoleDisplayLabel,
  getRoleHomeRoute,
  PUBLIC_HEADER_LINKS,
} from '../../constants/navigation.js';

const auth = useAuthStore();
const router = useRouter();
const isMenuOpen = ref(false);
const { isPatient, role } = useRoleVisibility(auth);

auth.fetchCurrentUser();

const publicLinks = PUBLIC_HEADER_LINKS;

const roleLabel = computed(() => {
  return getRoleDisplayLabel(role.value, 'Tài khoản');
});

const dashboardRoute = computed(() => {
  return getRoleHomeRoute(role.value, '/');
});

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleLogout = async () => {
  await auth.logout();
  closeMenu();
  router.push(AUTH_ROUTE.login);
};
</script>

<style scoped>
.app-header {
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #d1d5db;
  position: sticky;
  top: 0;
  z-index: 30;
}

.header-inner {
  width: min(1800px, 96vw);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
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
  padding: 8px 10px;
  border: 1px solid transparent;
}

.menu a:hover,
.menu a:focus-visible {
  border-color: #d1d5db;
  background: #f8fafc;
}

.auth-zone {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.identity {
  margin: 0;
  color: #64748b;
  font-size: 13px;
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

.action.primary {
  border-color: #111827;
  background: #111827;
  color: #ffffff;
  font-weight: 600;
}

@media (max-width: 900px) {
  .header-inner {
    align-items: center;
    width: 92vw;
    padding: 10px 0;
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

  .identity {
    text-align: center;
  }

  .menu a,
  .action {
    justify-content: center;
  }
}
</style>