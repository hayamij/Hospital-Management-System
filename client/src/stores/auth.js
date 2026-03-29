import { defineStore } from 'pinia';
import { authApi } from '../services/api.js';

const STORAGE_KEY = 'hms.session';

const parseJwtPayload = (token) => {
	try {
		const payloadPart = token.split('.')[1];
		if (!payloadPart) return null;
		const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
		const json = decodeURIComponent(
			atob(base64)
				.split('')
				.map((ch) => `%${`00${ch.charCodeAt(0).toString(16)}`.slice(-2)}`)
				.join('')
		);
		return JSON.parse(json);
	} catch {
		return null;
	}
};

export const useAuthStore = defineStore('auth', {
	state: () => ({
		token: null,
		userProfile: null,
		role: null,
		initialized: false,
		loading: false,
		error: null,
	}),
	getters: {
		isAuthenticated: (state) => Boolean(state.token),
		userId: (state) => state.userProfile?.id ?? null,
		email: (state) => state.userProfile?.email ?? null,
		defaultRoute: (state) => {
			if (state.role === 'admin') return '/admin/dashboard';
			if (state.role === 'doctor') return '/doctor/dashboard';
			if (state.role === 'patient') return '/patient/dashboard';
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
					this.token = parsed.token ?? null;
					this.userProfile = parsed.userProfile ?? null;
					this.role = parsed.role ?? null;
				} catch (e) {
					console.error('Failed to parse session', e);
				}
			}
			this.initialized = true;
		},
		persist() {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ token: this.token, userProfile: this.userProfile, role: this.role })
			);
		},
		clear() {
			this.token = null;
			this.userProfile = null;
			this.role = null;
			this.error = null;
			localStorage.removeItem(STORAGE_KEY);
		},
		async login(credentials) {
			this.loading = true;
			this.error = null;
			try {
				const data = await authApi.login(credentials);
				const token = data?.token ?? data?.accessToken ?? null;
				const decoded = token ? parseJwtPayload(token) : null;

				if (!token) {
					throw new Error('Login response missing token');
				}

				this.token = token;
				this.role = data?.role ?? decoded?.role ?? null;
				this.userProfile = {
					id: data?.userId ?? decoded?.sub ?? null,
					email: data?.email ?? decoded?.email ?? credentials?.identifier ?? null,
					name: data?.fullName ?? null,
				};
				this.persist();
				return data;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async fetchCurrentUser() {
			this.hydrate();
			if (!this.token) return null;

			const payload = parseJwtPayload(this.token);
			if (payload) {
				this.role = this.role ?? payload.role ?? null;
				this.userProfile = {
					id: this.userProfile?.id ?? payload.sub ?? null,
					email: this.userProfile?.email ?? payload.email ?? null,
					name: this.userProfile?.name ?? null,
				};
				this.persist();
			}

			return this.userProfile;
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
