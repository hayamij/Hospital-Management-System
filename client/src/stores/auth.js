import { defineStore } from 'pinia';
import { authApi } from '../services/api.js';
import { getRoleHomeRoute } from '../constants/navigation.js';
import {
	clearStoredSession,
	readStoredSession,
	writeStoredSession,
} from '../services/sessionStorage.js';

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
		refreshToken: null,
		userProfile: null,
		role: null,
		initialized: false,
		loading: false,
		error: null,
	}),
	getters: {
		isAuthenticated: (state) => Boolean(state.token),
		userId: (state) => state.userProfile?.id ?? null,
		patientId: (state) => state.userProfile?.patientId ?? null,
		doctorId: (state) => state.userProfile?.doctorId ?? null,
		email: (state) => state.userProfile?.email ?? null,
		defaultRoute: (state) => getRoleHomeRoute(state.role, '/'),
	},
	actions: {
		hydrate() {
			if (this.initialized) return;
			const session = readStoredSession();
			if (session) {
				this.token = session.token ?? null;
				this.refreshToken = session.refreshToken ?? null;
				this.userProfile = session.userProfile ?? null;
				this.role = session.role ?? null;
			}
			this.initialized = true;
		},
		persist() {
			writeStoredSession({
				token: this.token,
				refreshToken: this.refreshToken,
				userProfile: this.userProfile,
				role: this.role,
			});
		},
		clear() {
			this.token = null;
			this.refreshToken = null;
			this.userProfile = null;
			this.role = null;
			this.error = null;
			clearStoredSession();
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
				this.refreshToken = data?.refreshToken ?? null;
				this.role = data?.role ?? decoded?.role ?? null;
				this.userProfile = {
					id: data?.userId ?? decoded?.sub ?? null,
					patientId: data?.patientId ?? this.userProfile?.patientId ?? null,
					doctorId:
						data?.doctorId
						?? decoded?.doctorId
						?? this.userProfile?.doctorId
						?? null,
					email: data?.email ?? decoded?.email ?? credentials?.email ?? credentials?.identifier ?? null,
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
					patientId: this.userProfile?.patientId ?? null,
					doctorId: this.userProfile?.doctorId ?? payload.doctorId ?? null,
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
				await authApi.logout({
					token: this.token,
					refreshToken: this.refreshToken,
				});
			} catch (e) {
				console.warn('Logout failed', e);
			} finally {
				this.clear();
			}
		},
	},
});
