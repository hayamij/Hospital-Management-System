<template>
	<div class="page">
		<header class="panel workspace-header" :class="{ 'doctor-theme': isDoctor }">
			<div class="header-copy">
				<p v-if="isDoctor" class="eyebrow">DOCTOR SCHEDULER</p>
				<h1>{{ isDoctor ? 'Điều phối lịch hẹn bác sĩ' : 'Lịch hẹn' }}</h1>
				<p>
					{{
						isDoctor
							? 'Duyệt lịch mới, cập nhật trạng thái khám và theo dõi toàn bộ lịch hẹn theo thời gian thực.'
							: 'Yêu cầu, đặt lịch, đổi lịch, hủy và cập nhật trạng thái lịch hẹn.'
					}}
				</p>
			</div>

			<div class="header-actions">
				<label class="status-filter">
					<span>Trạng thái</span>
					<select v-model="filters.status" @change="refresh">
						<option value="">Tất cả trạng thái</option>
						<option value="pending">Chờ bác sĩ duyệt</option>
						<option value="scheduled">Đã lên lịch</option>
						<option value="in_progress">Đang khám</option>
						<option value="completed">Hoàn tất</option>
						<option value="cancelled">Đã hủy</option>
						<option value="no_show">Vắng mặt</option>
					</select>
				</label>
				<button type="button" @click="refresh">Làm mới</button>
			</div>
		</header>

		<section v-if="isDoctor" class="doctor-kpi-grid">
			<article class="panel kpi-card waiting">
				<p class="kpi-label">Yêu cầu chờ duyệt</p>
				<p class="kpi-value">{{ doctorPendingAppointments.length }}</p>
				<p class="kpi-note">Lịch hẹn cần bác sĩ chấp nhận hoặc từ chối.</p>
			</article>

			<article class="panel kpi-card primary">
				<p class="kpi-label">Tổng lịch hiển thị</p>
				<p class="kpi-value">{{ appointments.items.length }}</p>
				<p class="kpi-note">Số lịch hẹn theo bộ lọc đang áp dụng.</p>
			</article>

			<article class="panel kpi-card done">
				<p class="kpi-label">Có thể cập nhật trạng thái</p>
				<p class="kpi-value">{{ doctorActionableCount }}</p>
				<p class="kpi-note">Các lịch đã được duyệt và sẵn sàng thao tác trạng thái.</p>
			</article>
		</section>

		<div v-if="isDoctor" class="panel">
			<div class="section-head">
				<h2>Yêu cầu lịch hẹn mới</h2>
				<small>{{ doctorPendingAppointments.length }} yêu cầu đang chờ</small>
			</div>
			<p class="muted">Duyệt nhanh các lịch hẹn mới gửi tới bác sĩ.</p>
			<div v-if="doctorPendingAppointments.length === 0">Không có yêu cầu chờ duyệt.</div>
			<div v-else class="list-grid">
				<div v-for="item in doctorPendingAppointments" :key="`pending-${item.id || item.appointmentId}`" class="item doctor-item">
					<div>
						<p><strong>{{ item.reason || 'Lịch hẹn mới' }}</strong></p>
						<p>{{ item.startAt }} -> {{ item.endAt }}</p>
						<p>Bệnh nhân: {{ item.patientId || item.patient?.id || 'Chưa xác định' }}</p>
					</div>
					<div class="row">
						<button type="button" @click="decide(item, 'accept')" :disabled="appointments.loading">Chấp nhận</button>
						<button type="button" @click="decide(item, 'reject')" :disabled="appointments.loading">Từ chối</button>
					</div>
				</div>
			</div>
		</div>

		<div v-if="isPatient" class="panel">
			<h2>Đặt lịch mới</h2>
			<form class="grid four" @submit.prevent="handleSchedule">
				<input v-model="createForm.doctorId" required placeholder="Mã bác sĩ" />
				<input v-model="createForm.startAt" required type="datetime-local" />
				<input v-model="createForm.endAt" required type="datetime-local" />
				<input v-model="createForm.reason" required placeholder="Lý do" />
				<button type="submit" :disabled="appointments.loading">Đặt lịch</button>
			</form>
		</div>

		<div class="panel">
			<div class="section-head">
				<h2>Danh sách lịch hẹn</h2>
				<small>{{ appointments.items.length }} bản ghi</small>
			</div>
			<div v-if="appointments.items.length === 0">Chưa có lịch hẹn.</div>
			<div class="list-grid">
				<div
					v-for="item in appointments.items"
					:key="item.id || item.appointmentId"
					class="item doctor-item"
				>
					<div>
						<p><strong>{{ item.reason || 'Lịch hẹn' }}</strong></p>
						<p>{{ item.startAt }} -> {{ item.endAt }}</p>
						<p>Trạng thái: {{ formatStatus(item.status) }}</p>
						<p>Bác sĩ: {{ item.doctorId || item.doctor?.id || 'Chưa xác định' }}</p>
					</div>
					<div class="row">
						<template v-if="isPatient">
							<button type="button" @click="cancel(item)">Hủy</button>
							<button type="button" @click="openReschedule(item)">Đổi lịch</button>
						</template>
						<template v-else-if="isDoctor">
							<select v-if="canUpdateStatus(item)" v-model="item.statusUpdate" @change="updateStatus(item)">
								<option disabled value="">Cập nhật</option>
								<option value="completed">Hoàn tất</option>
								<option value="no_show">Vắng mặt</option>
								<option value="cancelled">Đã hủy</option>
							</select>
							<p v-else class="muted">Đợi quyết định duyệt ở mục "Yêu cầu lịch hẹn mới".</p>
						</template>
					</div>
				</div>
			</div>
		</div>

		<div v-if="showReschedule" class="panel">
			<div class="section-head">
				<h2>Đổi lịch hẹn</h2>
				<small>Điều chỉnh lại khung giờ cho lịch đã chọn</small>
			</div>
			<form class="grid three" @submit.prevent="handleReschedule">
				<input v-model="rescheduleForm.startAt" required type="datetime-local" />
				<input v-model="rescheduleForm.endAt" required type="datetime-local" />
				<div class="row">
					<button type="submit" :disabled="appointments.loading">Cập nhật</button>
					<button type="button" @click="showReschedule = null">Đóng</button>
				</div>
			</form>
		</div>

		<p v-if="appointments.error" class="msg err">{{ appointments.error }}</p>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useAppointmentsStore } from '../stores/appointments.js';
import { useRoleVisibility } from '../composables/useRoleVisibility.js';
import {
	canRoleUpdateAppointmentStatus,
	getDoctorPendingAppointments,
} from './controllers/appointmentsController.js';

const auth = useAuthStore();
const appointments = useAppointmentsStore();
const { isPatient, isDoctor, role } = useRoleVisibility(auth);
const filters = reactive({ status: '' });

const createForm = reactive({ doctorId: '', startAt: '', endAt: '', reason: '' });
const rescheduleForm = reactive({ startAt: '', endAt: '' });
const showReschedule = ref(null);

const doctorPendingAppointments = computed(() => {
	return getDoctorPendingAppointments(appointments.items, role.value);
});

const doctorActionableCount = computed(() => {
	return appointments.items.filter((item) => canRoleUpdateAppointmentStatus(item, role.value)).length;
});

const canUpdateStatus = (item) => canRoleUpdateAppointmentStatus(item, role.value);

const statusLabelMap = {
	pending: 'Chờ duyệt',
	requested: 'Yêu cầu mới',
	scheduled: 'Đã lên lịch',
	in_progress: 'Đang khám',
	completed: 'Hoàn tất',
	cancelled: 'Đã hủy',
	no_show: 'Vắng mặt',
};

const formatStatus = (status) => statusLabelMap[String(status || '').toLowerCase()] || status || 'Chưa rõ';

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

const decide = async (item, decision) => {
	await appointments.updateStatus(item.id || item.appointmentId, { decision });
};
</script>

<style scoped>
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
	align-items: end;
	gap: 10px;
	flex-wrap: wrap;
}

.status-filter {
	display: grid;
	gap: 8px;
	min-width: 220px;
}

.status-filter span {
	color: #334155;
	font-weight: 600;
}

.doctor-kpi-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14px;
}

.kpi-card {
	display: grid;
	gap: 8px;
	align-content: start;
}

.kpi-card.primary {
	background: linear-gradient(120deg, #eff6ff 0%, #eef2ff 100%);
}

.kpi-card.waiting {
	background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
}

.kpi-card.done {
	background: linear-gradient(120deg, #ecfeff 0%, #f0fdf4 100%);
}

.kpi-label {
	margin: 0;
	color: #475569;
}

.kpi-value {
	margin: 0;
	font-size: 36px;
	line-height: 1.1;
	font-weight: 700;
	color: #0f172a;
}

.kpi-note {
	margin: 0;
	color: #334155;
}

.section-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	margin-bottom: 12px;
}

.section-head h2 {
	margin: 0;
}

.section-head small {
	color: #64748b;
}

.four { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.doctor-item { display: grid; gap: 14px; grid-template-columns: 1fr auto; border: 1px solid #dbe2ea; border-radius: 12px; background: #f8fafc; padding: 14px; }

.doctor-item p {
	margin: 0 0 6px;
	color: #334155;
}

@media (max-width: 800px) { .item { grid-template-columns: 1fr; } }

@media (max-width: 1100px) {
	.header-copy h1 {
		font-size: 28px;
	}

	.doctor-kpi-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 800px) { .doctor-item { grid-template-columns: 1fr; } }
</style>
