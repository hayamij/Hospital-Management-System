import { computed } from 'vue';
import { isRole } from '../constants/navigation.js';
import { useAuthStore } from '../stores/auth.js';

export const useRoleVisibility = (authStore = useAuthStore()) => {
  const role = computed(() => authStore.role);

  const isPatient = computed(() => isRole(role.value, 'patient'));
  const isDoctor = computed(() => isRole(role.value, 'doctor'));
  const isAdmin = computed(() => isRole(role.value, 'admin'));

  const matchesRole = (expectedRole) => isRole(role.value, expectedRole);
  const matchesAnyRole = (...roles) => roles.some((item) => isRole(role.value, item));

  return {
    role,
    isPatient,
    isDoctor,
    isAdmin,
    matchesRole,
    matchesAnyRole,
  };
};
