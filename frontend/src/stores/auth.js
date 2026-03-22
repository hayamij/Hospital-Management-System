import { defineStore } from 'pinia';
import * as api from '../services/api.js';

// Auth store: login/logout/reset; keeps user session state
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: { id: 'guest', name: 'Guest', role: 'guest', token: null },
    loading: false,
    error: null,
  }),
  getters: {
    currentUserRole: (state) => state.user?.role ?? 'guest',
    isAuthenticated: (state) => Boolean(state.user?.token),
  },
  actions: {
    async login({ email, password, role, name }) {
      this.loading = true; this.error = null;
      try {
        const res = await api.login({ email, password });
        this.user = { id: res.userId ?? res.id ?? `user-${Math.random().toString(36).slice(2, 8)}`, role: role ?? res.role ?? 'patient', name: name ?? email ?? 'User', token: res.token };
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async doctorLogin(payload) {
      this.loading = true; this.error = null;
      try {
        const res = await api.doctorLogin(payload);
        this.user = { id: res.userId ?? res.id ?? `doctor-${Math.random().toString(36).slice(2, 8)}`, role: 'doctor', name: payload?.name ?? payload?.email ?? 'Doctor', token: res.token };
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async adminLogin(payload) {
      this.loading = true; this.error = null;
      try {
        const res = await api.adminLogin(payload);
        this.user = { id: res.userId ?? res.id ?? `admin-${Math.random().toString(36).slice(2, 8)}`, role: 'admin', name: payload?.name ?? payload?.email ?? 'Admin', token: res.token };
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async logout(payload = {}) {
      this.loading = true; this.error = null;
      try {
        await api.logout({ userId: this.user.id, ...payload });
        this.user = { id: 'guest', name: 'Guest', role: 'guest', token: null };
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async resetPassword(email) {
      this.loading = true; this.error = null;
      try { return await api.resetPassword({ email }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
  },
});
