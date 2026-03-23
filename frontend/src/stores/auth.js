import { defineStore } from 'pinia';
import { authApi } from '../services/api.js';

const STORAGE_KEY = 'hms.session';

export const useAuthStore = defineStore('auth', {
	state: () => ({
		token: null,
		role: null,
		userId: null,
		email: null,
		initialized: false,
		loading: false,
		error: null,
	}),
	getters: {
		isAuthenticated: (state) => Boolean(state.token),
		defaultRoute: (state) => {
			if (state.role === 'admin') return '/dashboard';
			if (state.role === 'doctor') return '/doctor-ops';
			if (state.role === 'patient') return '/patients';
			return '/';
		},
	},
	actions: {
		hydrate() {
			if (this.initialized) return;
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				try {
					const parsed = JSON.parse(raw);
					Object.assign(this, parsed, { initialized: true });
				} catch (e) {
					console.error('Failed to parse session', e);
				}
			}
			this.initialized = true;
		},
		persist() {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ token: this.token, role: this.role, userId: this.userId, email: this.email })
			);
		},
		clear() {
			this.token = null;
			this.role = null;
			this.userId = null;
			this.email = null;
			this.error = null;
			localStorage.removeItem(STORAGE_KEY);
		},
		async login({ identifier, password }) {
			this.loading = true;
			this.error = null;
			try {
				const data = await authApi.login({ identifier, password });
				const resolvedRole = data?.role || 'patient';
				const fallbackTokenByRole = {
					admin: 'admin-token',
					doctor: 'doctor-token',
					patient: 'mock-token',
				};

				this.token = data?.token || fallbackTokenByRole[resolvedRole] || 'mock-token';
				this.role = resolvedRole;
				this.userId = data.userId || data.doctorId || data.adminId || null;
				this.email = data.email || identifier;
				this.persist();
				return data;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async logout() {
			if (!this.token) {
				this.clear();
				return;
			}
			try {
				await authApi.logout(this.token);
			} catch (e) {
				console.warn('Logout failed', e);
			} finally {
				this.clear();
			}
		},
	},
});
