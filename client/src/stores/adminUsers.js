import { defineStore } from 'pinia';
import { adminApi } from '../services/api.js';
import { useAuthStore } from './auth.js';

const toUserModel = (source) => ({
  id: source?.id || source?.userId || '',
  name: source?.fullName || source?.name || '',
  email: source?.email || '',
  role: source?.role || 'patient',
  status: source?.status || 'active',
  type: source?.type || (source?.role === 'doctor' ? 'doctor' : source?.role === 'admin' ? 'admin' : 'patient'),
});

export const useAdminUsersStore = defineStore('adminUsers', {
  state: () => ({
    users: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    saving: false,
    error: null,
  }),
  actions: {
    async fetchUsers(filters = {}) {
      const auth = useAuthStore();
      if (auth.role !== 'admin') return;

      this.loading = true;
      this.error = null;
      try {
        const response = await adminApi.listUsers(auth.token, {
          q: filters.query,
          type: filters.type,
          page: filters.page || this.page,
          pageSize: filters.pageSize || this.pageSize,
        });

        this.users = Array.isArray(response?.users) ? response.users.map(toUserModel) : [];
        this.page = response?.page || 1;
        this.pageSize = response?.pageSize || this.pageSize;
        this.total = response?.total || this.users.length;
        return response;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createUser(payload) {
      const auth = useAuthStore();
      if (auth.role !== 'admin') return;

      this.saving = true;
      this.error = null;
      try {
        const created = await adminApi.createUser(auth.token, payload);
        await this.fetchUsers({ page: this.page, pageSize: this.pageSize });
        return created;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async updateUser(userId, payload) {
      const auth = useAuthStore();
      if (auth.role !== 'admin') return;

      this.saving = true;
      this.error = null;
      try {
        const updated = await adminApi.updateUser(auth.token, userId, payload);
        await this.fetchUsers({ page: this.page, pageSize: this.pageSize });
        return updated;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },
  },
});
