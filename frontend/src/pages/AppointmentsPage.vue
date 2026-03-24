<template>
	<div class="page">
		<header class="panel">
			<h1>Appointments</h1>
			<p>Request, schedule, reschedule, cancel and update appointment status.</p>
			<div class="row">
				<select v-model="filters.status" @change="refresh">
					<option value="">All statuses</option>
					<option value="scheduled">Scheduled</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
					<option value="no_show">No show</option>
				</select>
				<button type="button" @click="refresh">Refresh</button>
			</div>
		</header>

		<div v-if="auth.role === 'patient'" class="panel">
			<h2>Schedule new appointment</h2>
			<form class="grid four" @submit.prevent="handleSchedule">
				<input v-model="createForm.doctorId" required placeholder="Doctor ID" />
				<input v-model="createForm.startAt" required type="datetime-local" />
				<input v-model="createForm.endAt" required type="datetime-local" />
				<input v-model="createForm.reason" required placeholder="Reason" />
				<button type="submit" :disabled="appointments.loading">Schedule</button>
			</form>
		</div>

		<div class="panel">
			<h2>Appointments list ({{ appointments.items.length }})</h2>
			<div v-if="appointments.items.length === 0">No appointments found.</div>
			<div class="list-grid">
				<div
					v-for="item in appointments.items"
					:key="item.id || item.appointmentId"
					class="item"
				>
					<div>
						<p><strong>{{ item.reason || 'Appointment' }}</strong></p>
						<p>{{ item.startAt }} -> {{ item.endAt }}</p>
						<p>Status: {{ item.status }}</p>
						<p>Doctor: {{ item.doctorId || item.doctor?.id || 'TBD' }}</p>
					</div>
					<div class="row">
						<template v-if="auth.role === 'patient'">
							<button type="button" @click="cancel(item)">Cancel</button>
							<button type="button" @click="openReschedule(item)">Reschedule</button>
						</template>
						<template v-else-if="auth.role === 'doctor'">
							<select v-model="item.decisionUpdate" @change="updateDecision(item)">
								<option disabled value="">Decision</option>
								<option value="accepted">Accept</option>
								<option value="rejected">Reject</option>
							</select>
							<select v-model="item.statusUpdate" @change="updateStatus(item)">
								<option disabled value="">Update</option>
								<option value="completed">Completed</option>
								<option value="no_show">No show</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</template>
					</div>
				</div>
			</div>
		</div>

		<div v-if="showReschedule" class="panel">
			<h2>Reschedule appointment</h2>
			<form class="grid three" @submit.prevent="handleReschedule">
				<input v-model="rescheduleForm.startAt" required type="datetime-local" />
				<input v-model="rescheduleForm.endAt" required type="datetime-local" />
				<div class="row">
					<button type="submit" :disabled="appointments.loading">Update</button>
					<button type="button" @click="showReschedule = null">Close</button>
				</div>
			</form>
		</div>

		<p v-if="appointments.error" class="msg err">{{ appointments.error }}</p>
	</div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useAppointmentsStore } from '../stores/appointments.js';

const auth = useAuthStore();
const appointments = useAppointmentsStore();
const filters = reactive({ status: '' });

const createForm = reactive({ doctorId: '', startAt: '', endAt: '', reason: '' });
const rescheduleForm = reactive({ startAt: '', endAt: '' });
const showReschedule = ref(null);

const refresh = () => appointments.fetchAppointments({ status: filters.status });

onMounted(() => {
	refresh();
});

const handleSchedule = async () => {
	await appointments.schedule({ ...createForm });
	Object.assign(createForm, { doctorId: '', startAt: '', endAt: '', reason: '' });
};

const openReschedule = (item) => {
	showReschedule.value = item;
	rescheduleForm.startAt = item.startAt;
	rescheduleForm.endAt = item.endAt;
};

const handleReschedule = async () => {
	if (!showReschedule.value) return;
	await appointments.reschedule(showReschedule.value.id || showReschedule.value.appointmentId, {
		startAt: rescheduleForm.startAt,
		endAt: rescheduleForm.endAt,
	});
	showReschedule.value = null;
};

const cancel = async (item) => {
	await appointments.cancel(item.id || item.appointmentId);
};

const updateStatus = async (item) => {
	if (!item.statusUpdate) return;
	await appointments.updateStatus(item.id || item.appointmentId, { status: item.statusUpdate });
	item.statusUpdate = '';
};

const updateDecision = async (item) => {
	if (!item.decisionUpdate) return;
	await appointments.updateStatus(item.id || item.appointmentId, { decision: item.decisionUpdate });
	item.decisionUpdate = '';
};
</script>

<style scoped>
.four { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.item { display: grid; gap: 14px; grid-template-columns: 1fr auto; }
@media (max-width: 800px) { .item { grid-template-columns: 1fr; } }
</style>
