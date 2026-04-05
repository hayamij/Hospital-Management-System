<template>
	<div class="page">
		<header class="panel workspace-header" :class="{ 'doctor-theme': isDoctor }">
			<div class="header-copy">
				<p v-if="isDoctor" class="eyebrow">DOCTOR SCHEDULER</p>
				<p v-if="isAdmin" class="eyebrow">ADMIN APPOINTMENTS</p>
				<h1>{{ isDoctor ? 'Điều phối lịch hẹn bác sĩ' : isAdmin ? 'Lịch trình toàn hệ thống' : 'Lịch hẹn' }}</h1>
				<p>
					{{
						isDoctor
							? 'Duyệt lịch mới, cập nhật trạng thái khám và theo dõi toàn bộ lịch hẹn theo thời gian thực.'
							: isAdmin
								? 'Theo dõi và lọc danh sách lịch hẹn theo trạng thái cho toàn bộ hệ thống.'
								: 'Yêu cầu, đặt lịch, đổi lịch, hủy và cập nhật trạng thái lịch hẹn.'
					}}
				</p>
			</div>

			<div class="header-actions">
				<label class="status-filter">
					<span>Trạng thái</span>
					<select v-model="filters.status" @change="onStatusFilterChange">
						<option value="">Tất cả trạng thái</option>
						<option value="pending">Chờ bác sĩ duyệt</option>
						<option value="scheduled">Đã lên lịch</option>
						<option value="in_progress">Đang khám</option>
						<option value="completed">Hoàn tất</option>
						<option value="cancelled">Đã hủy</option>
						<option value="no_show">Vắng mặt</option>
					</select>
				</label>
				<span v-if="showBackofficePagination" class="header-page-indicator">
					Trang {{ appointments.page }} / {{ totalPages }}
				</span>
				<button type="button" class="refresh-btn" :disabled="appointments.loading" @click="handleRefresh">Làm mới</button>
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
				<p class="kpi-value">{{ appointments.total }}</p>
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
				<small>{{ appointments.items.length }} / {{ appointments.total }} bản ghi</small>
			</div>
			<div v-if="appointments.items.length === 0">Chưa có lịch hẹn.</div>
			<div v-else-if="isAdmin" class="appointments-table-wrap">
				<DataTable
					:columns="adminTableColumns"
					:rows="adminTableRows"
					row-key="id"
					empty-text="Chưa có lịch hẹn."
				>
					<template #cell-id="{ value }">
						<span class="cell-clip cell-mono" :title="value || '-'">{{ value || '-' }}</span>
					</template>
					<template #cell-reason="{ value }">
						<span class="cell-clip" :title="value || '-'">{{ value || '-' }}</span>
					</template>
					<template #cell-time="{ value }">
						<span class="cell-clip" :title="value || '-'">{{ value || '-' }}</span>
					</template>
					<template #cell-status="{ value }">
						<span class="status-pill" :class="statusBadgeClass(value)" :title="formatStatus(value)">{{ formatStatus(value) }}</span>
					</template>
				</DataTable>
			</div>
			<div v-else class="list-grid">
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

			<div v-if="showBackofficePagination" class="pagination-bar">
				<div class="pagination-meta">
					Trang {{ appointments.page }} / {{ totalPages }} · {{ appointments.total }} lịch hẹn
				</div>

				<div class="pagination-controls">
					<span class="pager-inline-label">Mỗi trang</span>
					<select
						class="pager-field pager-select"
						v-model.number="appointments.pageSize"
						:disabled="appointments.loading"
						@change="onPageSizeChange"
					>
						<option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
					</select>

					<span class="pager-inline-label">Đến trang</span>
					<input
						class="pager-field"
						v-model.number="quickPageInput"
						type="number"
						min="1"
						:max="totalPages"
						:disabled="appointments.loading"
						@keyup.enter="jumpToPage"
					/>
					<button type="button" class="pager-btn" :disabled="appointments.loading" @click="jumpToPage">Đi</button>

					<button type="button" class="pager-btn" :disabled="appointments.loading || !canGoPrev" @click="goToPrevPage">
						Trang trước
					</button>
					<button type="button" class="pager-btn" :disabled="appointments.loading || !canGoNext" @click="goToNextPage">
						Trang sau
					</button>
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DataTable from '../../components/shared/DataTable.vue';
import { useAuthStore } from '../../stores/auth.js';
import { useAppointmentsStore } from '../../stores/appointments.js';
import { useRoleVisibility } from '../../composables/useRoleVisibility.js';
import {
	canRoleUpdateAppointmentStatus,
	getDoctorPendingAppointments,
} from '../controllers/backoffice/appointmentsController.js';

const auth = useAuthStore();
const appointments = useAppointmentsStore();
const { isPatient, isDoctor, isAdmin, role } = useRoleVisibility(auth);
const ADMIN_DEFAULT_PAGE_SIZE = 10;
const filters = reactive({ status: '' });
const pageSizeOptions = [5, 10, 20, 50];
const quickPageInput = ref(1);

const createForm = reactive({ doctorId: '', startAt: '', endAt: '', reason: '' });
const rescheduleForm = reactive({ startAt: '', endAt: '' });
const showReschedule = ref(null);

const doctorPendingAppointments = computed(() => {
	return getDoctorPendingAppointments(appointments.items, role.value);
});

const doctorActionableCount = computed(() => {
	return appointments.items.filter((item) => canRoleUpdateAppointmentStatus(item, role.value)).length;
});

const adminTableColumns = [
	{ key: 'id', label: 'Mã lịch', width: '130px' },
	{ key: 'reason', label: 'Lý do' },
	{ key: 'time', label: 'Khung giờ', width: '280px' },
	{ key: 'doctorId', label: 'Bác sĩ', width: '110px' },
	{ key: 'patientId', label: 'Bệnh nhân', width: '110px' },
	{ key: 'status', label: 'Trạng thái', width: '130px', align: 'center' },
];

const adminTableRows = computed(() => {
	return appointments.items.map((item) => ({
		id: item.id || item.appointmentId || '-',
		reason: item.reason || 'Lịch hẹn',
		time: `${item.startAt || '-'} -> ${item.endAt || '-'}`,
		doctorId: item.doctorId || item.doctor?.id || '-',
		patientId: item.patientId || item.patient?.id || '-',
		status: item.status || '',
	}));
});

const totalPages = computed(() => {
	const pageSize = Number(appointments.pageSize) || 10;
	const total = Number(appointments.total) || 0;
	return Math.max(1, Math.ceil(total / pageSize));
});

const showBackofficePagination = computed(() => {
	return (isDoctor.value || isAdmin.value) && appointments.total > 0;
});

const canGoPrev = computed(() => appointments.page > 1);
const canGoNext = computed(() => appointments.page < totalPages.value);

watch(
	() => appointments.page,
	(page) => {
		quickPageInput.value = Math.max(1, Number(page) || 1);
	},
	{ immediate: true }
);

watch(totalPages, (pages) => {
	const normalizedPages = Math.max(1, Number(pages) || 1);
	if (quickPageInput.value > normalizedPages) {
		quickPageInput.value = normalizedPages;
	}
	if (quickPageInput.value < 1) {
		quickPageInput.value = 1;
	}
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

const statusBadgeClass = (status) => {
	const normalized = String(status || '').toLowerCase();
	if (normalized === 'completed') return 'is-ok';
	if (normalized === 'scheduled' || normalized === 'in_progress') return 'is-info';
	if (normalized === 'pending' || normalized === 'requested') return 'is-warn';
	if (normalized === 'cancelled' || normalized === 'no_show') return 'is-off';
	return 'is-neutral';
};

const refresh = async ({ resetPage = false } = {}) => {
	if (resetPage) {
		appointments.page = 1;
	}

	await appointments.fetchAppointments({ status: filters.status });

	if ((isDoctor.value || isAdmin.value) && appointments.total > 0 && appointments.page > totalPages.value) {
		appointments.page = totalPages.value;
		await appointments.fetchAppointments({ status: filters.status });
	}
};

const onStatusFilterChange = async () => {
	await refresh({ resetPage: true });
};

const handleRefresh = async () => {
	if (isAdmin.value) {
		filters.status = '';
		appointments.page = 1;
		appointments.pageSize = ADMIN_DEFAULT_PAGE_SIZE;
		quickPageInput.value = 1;
		await refresh();
		return;
	}

	await refresh();
};

const onPageSizeChange = async () => {
	appointments.page = 1;
	await refresh();
};

const jumpToPage = async () => {
	const requestedPage = Math.floor(Number(quickPageInput.value) || 1);
	const nextPage = Math.min(Math.max(requestedPage, 1), totalPages.value);
	quickPageInput.value = nextPage;
	if (nextPage === appointments.page) return;
	appointments.page = nextPage;
	await refresh();
};

const goToPrevPage = async () => {
	if (!canGoPrev.value) return;
	appointments.page -= 1;
	await refresh();
};

const goToNextPage = async () => {
	if (!canGoNext.value) return;
	appointments.page += 1;
	await refresh();
};

onMounted(async () => {
	await auth.fetchCurrentUser();
	await refresh({ resetPage: true });
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

.header-page-indicator {
	display: inline-flex;
	align-items: center;
	min-height: 44px;
	padding: 0 12px;
	border: 1px solid #cbd5e1;
	background: #f8fafc;
	color: #334155;
	font-weight: 600;
}

.pagination-bar {
	margin-top: 14px;
	padding-top: 14px;
	border-top: 1px solid #dbe2ea;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.pagination-meta {
	display: inline-flex;
	align-items: center;
	min-height: 44px;
	color: #334155;
	font-weight: 600;
}

.pagination-controls {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;
}

.pagination-controls .pager-inline-label {
	font-size: 12px;
	font-weight: 600;
	color: #475569;
	height: 44px;
	display: inline-flex;
	align-items: center;
}

.pagination-controls .pager-field {
	min-width: 84px;
	height: 44px;
}

.pagination-controls .pager-select {
	min-width: 88px;
}

.pagination-controls .pager-btn {
	min-width: 106px;
	padding: 0 12px;
	height: 44px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.appointments-table-wrap :deep(.data-table) {
	table-layout: fixed;
}

.appointments-table-wrap :deep(.data-table th),
.appointments-table-wrap :deep(.data-table td) {
	vertical-align: middle;
}

.cell-clip {
	display: block;
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cell-mono {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
}

.status-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	max-width: 100%;
	height: 26px;
	padding: 0 10px;
	border: 1px solid transparent;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.status-pill.is-ok {
	background: #ecfdf5;
	border-color: #86efac;
	color: #166534;
}

.status-pill.is-info {
	background: #eff6ff;
	border-color: #93c5fd;
	color: #1d4ed8;
}

.status-pill.is-warn {
	background: #fffbeb;
	border-color: #fcd34d;
	color: #92400e;
}

.status-pill.is-off {
	background: #fef2f2;
	border-color: #fca5a5;
	color: #991b1b;
}

.status-pill.is-neutral {
	background: #f8fafc;
	border-color: #cbd5e1;
	color: #334155;
}

.refresh-btn {
	min-width: 110px;
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

	.pagination-controls {
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.doctor-kpi-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 800px) { .doctor-item { grid-template-columns: 1fr; } }
</style>

