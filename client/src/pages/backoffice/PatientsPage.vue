<template>
	<div class="page">
		<header class="panel workspace-header" :class="{ 'doctor-theme': isDoctor }">
			<div class="header-copy">
				<p v-if="isDoctor" class="eyebrow">DOCTOR PATIENTS</p>
				<p v-if="isAdmin" class="eyebrow">ADMIN PATIENT MANAGEMENT</p>
				<h1>{{ isDoctor ? 'Theo dõi bệnh nhân' : isAdmin ? 'Quản lý bệnh nhân' : 'Bệnh nhân' }}</h1>
				<p>
					{{
						isDoctor
							? 'Tra cứu bệnh án bệnh nhân và truy cập nhanh hồ sơ điều trị theo mã bệnh nhân.'
							: isAdmin
								? 'Danh sách bệnh nhân toàn hệ thống với trạng thái tài khoản theo dữ liệu backend.'
								: 'Hồ sơ bệnh nhân và truy cập bệnh án.'
					}}
				</p>
			</div>
			<div class="header-actions">
				<button type="button" @click="handleRefresh">Làm mới</button>
			</div>
		</header>

		<section v-if="isDoctor" class="doctor-kpi-grid">
			<article class="panel kpi-card primary">
				<p class="kpi-label">Bệnh nhân đã đặt lịch/đã khám</p>
				<p class="kpi-value">{{ filteredDoctorPatients.length }}</p>
				<p class="kpi-note">Tổng bệnh nhân theo lịch hẹn thuộc bác sĩ.</p>
			</article>

			<article class="panel kpi-card waiting">
				<p class="kpi-label">Mã bệnh nhân đang xem</p>
				<p class="kpi-value code">{{ patientId || '--' }}</p>
				<p class="kpi-note">Nhập mã bệnh nhân để lọc hồ sơ chuyên biệt.</p>
			</article>
		</section>

		<section v-if="isDoctor" class="panel">
			<div class="section-head">
				<h2>Danh sách bệnh nhân đã đặt lịch / đã khám</h2>
				<small>{{ pagedDoctorPatients.length }} / {{ filteredDoctorPatients.length }} bệnh nhân</small>
			</div>

			<div class="toolbar" role="group" aria-label="Bộ lọc bệnh nhân bác sĩ">
				<input v-model.trim="doctorPatientSearch" type="text" placeholder="Tìm theo mã hoặc tên bệnh nhân..." />
				<select v-model.number="doctorPatientsPageSize">
					<option :value="5">5 / trang</option>
					<option :value="10">10 / trang</option>
					<option :value="20">20 / trang</option>
				</select>
				<button type="button" @click="loadDoctorPatientsList" :disabled="doctorPatientsLoading">Tải danh sách</button>
			</div>

			<p v-if="doctorPatientsLoading" class="muted">Đang tải danh sách bệnh nhân từ lịch hẹn...</p>
			<p v-else-if="doctorPatientsError" class="msg err">{{ doctorPatientsError }}</p>
			<p v-else-if="filteredDoctorPatients.length === 0" class="muted">Chưa có bệnh nhân phù hợp.</p>

			<DataTable
				v-else
				:columns="doctorPatientColumns"
				:rows="pagedDoctorPatients"
				row-key="patientId"
				empty-text="Không có bệnh nhân phù hợp."
			>
				<template #cell-lastAppointmentAt="{ value }">
					{{ formatDoctorDateTime(value) }}
				</template>
				<template #cell-actions="{ row }">
					<div class="table-actions single-action">
						<button type="button" @click="openDoctorPatientRecord(row)">Mở hồ sơ</button>
					</div>
				</template>
			</DataTable>

			<div class="pagination" v-if="filteredDoctorPatients.length > 0">
				<button type="button" class="pager-btn" :disabled="doctorPatientsPage <= 1" @click="goPrevDoctorPatientsPage">Trước</button>
				<span class="pagination-status">Trang {{ doctorPatientsPage }} / {{ doctorPatientsTotalPages }}</span>
				<button type="button" class="pager-btn" :disabled="doctorPatientsPage >= doctorPatientsTotalPages" @click="goNextDoctorPatientsPage">Sau</button>
			</div>
		</section>

		<section v-if="isAdmin" class="doctor-kpi-grid">
			<article class="panel kpi-card primary">
				<p class="kpi-label">Bệnh nhân đang hiển thị</p>
				<p class="kpi-value">{{ adminUsers.users.length }}</p>
				<p class="kpi-note">Danh sách theo bộ lọc vai trò bệnh nhân.</p>
			</article>

			<article class="panel kpi-card waiting">
				<p class="kpi-label">Tổng bệnh nhân</p>
				<p class="kpi-value">{{ adminUsers.total }}</p>
				<p class="kpi-note">Tổng số tài khoản bệnh nhân trong hệ thống.</p>
			</article>
		</section>

		<section v-if="isPatient" class="panel">
			<div class="section-head">
				<h2>Cập nhật hồ sơ</h2>
				<small>Cập nhật nhanh thông tin cá nhân đang sử dụng</small>
			</div>
			<form class="grid two" @submit.prevent="updateProfile">
				<input v-model="profile.name" placeholder="Họ và tên" />
				<input v-model="profile.phone" placeholder="Số điện thoại" />
				<input v-model="profile.address" placeholder="Địa chỉ" />
				<input v-model="profile.dateOfBirth" type="date" />
				<input v-model="profile.emergencyContact" placeholder="Liên hệ khẩn cấp" />
				<button type="submit">Lưu hồ sơ</button>
			</form>
		</section>

		<section v-if="isDoctor" class="panel">
			<div class="section-head">
				<h2>Bệnh án bệnh nhân</h2>
				<small>Truy vấn theo mã bệnh nhân để mở đúng hồ sơ</small>
			</div>
			<div class="row">
				<input v-model="patientId" placeholder="Mã bệnh nhân" />
				<button type="button" @click="loadRecords">Tải bệnh án</button>
			</div>
			<div class="list-grid">
				<article v-for="rec in patients.records" :key="rec.id || rec.recordId" class="item doctor-item">
					<p><strong>{{ rec.note || 'Ghi chú' }}</strong></p>
					<p>{{ rec.recordedAt }} | Bác sĩ {{ rec.doctorName || rec.authorDoctorName || rec.doctorId || rec.authorDoctorId || '-' }}</p>
				</article>
			</div>
		</section>

		<section v-if="isAdmin" class="panel">
			<div class="section-head">
				<h2>Danh sách bệnh nhân</h2>
				<small>{{ adminUsers.users.length }} / {{ adminUsers.total }} bản ghi</small>
			</div>

			<div class="toolbar" role="group" aria-label="Bộ lọc bệnh nhân">
				<input v-model.trim="searchText" type="text" placeholder="Tìm theo tên, email hoặc ID..." />
				<select v-model.number="pageSize">
					<option :value="5">5 / trang</option>
					<option :value="10">10 / trang</option>
					<option :value="20">20 / trang</option>
				</select>
				<button type="button" @click="refreshAdminPatients">Tìm</button>
			</div>

			<div class="patients-table-wrap">
				<DataTable
					:columns="adminColumns"
					:rows="adminUsers.users"
					row-key="id"
					empty-text="Không có dữ liệu bệnh nhân."
				>
					<template #cell-id="{ value }">
						<span class="cell-clip cell-mono" :title="value || '-'">{{ value || '-' }}</span>
					</template>
					<template #cell-name="{ value }">
						<span class="cell-clip" :title="value || '-'">{{ value || '-' }}</span>
					</template>
					<template #cell-email="{ value }">
						<span class="cell-clip" :title="value || '-'">{{ value || '-' }}</span>
					</template>
					<template #cell-role>
						Bệnh nhân
					</template>
					<template #cell-status="{ value }">
						<span class="status-badge" :class="patientStatusBadgeClass(value)" :title="formatStatus(value)">
							{{ formatStatus(value) }}
						</span>
					</template>
					<template #cell-actions="{ row }">
						<div class="table-actions">
							<button
								type="button"
								:disabled="adminUsers.saving"
								@click="togglePatientStatus(row)"
							>
								{{ isPatientDisabled(row) ? 'Mở' : 'Khóa' }}
							</button>
							<button type="button" @click="viewPatientRecords(row)">Hồ sơ</button>
						</div>
					</template>
				</DataTable>
			</div>

			<div class="pagination">
				<span class="pager-inline-label">Đến trang</span>
				<input
					class="pager-field"
					v-model.number="quickPageInput"
					type="number"
					min="1"
					:max="adminTotalPages"
					:disabled="adminUsers.loading"
					@keyup.enter="jumpToAdminPage"
				/>
				<button type="button" class="pager-btn" :disabled="adminUsers.loading" @click="jumpToAdminPage">Đi</button>
				<button type="button" class="pager-btn" :disabled="adminPage <= 1" @click="goPrevAdminPage">Trước</button>
				<span class="pagination-status">Trang {{ adminPage }} / {{ adminTotalPages }}</span>
				<button type="button" class="pager-btn" :disabled="adminPage >= adminTotalPages" @click="goNextAdminPage">Sau</button>
			</div>

			<div v-if="adminUsers.loading" class="msg">Đang tải danh sách bệnh nhân...</div>
		</section>

		<p v-if="patients.error || adminUsers.error" class="msg err">{{ patients.error || adminUsers.error }}</p>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '../../components/shared/DataTable.vue';
import { usePatientsStore } from '../../stores/patients.js';
import { useAdminUsersStore } from '../../stores/adminUsers.js';
import { useAuthStore } from '../../stores/auth.js';
import { doctorApi } from '../../services/api.js';
import { useRoleVisibility } from '../../composables/useRoleVisibility.js';

const auth = useAuthStore();
const { isDoctor, isPatient, isAdmin } = useRoleVisibility(auth);
const patients = usePatientsStore();
const adminUsers = useAdminUsersStore();
const router = useRouter();
const patientId = ref('');
const profile = reactive({ name: '', phone: '', address: '', dateOfBirth: '', emergencyContact: '' });
const searchText = ref('');
const pageSize = ref(10);
const adminPage = ref(1);
const quickPageInput = ref(1);
const isRefreshingAdmin = ref(false);
const doctorPatientsLoading = ref(false);
const doctorPatientsError = ref('');
const doctorPatientsRaw = ref([]);
const doctorPatientSearch = ref('');
const doctorPatientsPage = ref(1);
const doctorPatientsPageSize = ref(10);

const completedAppointmentStatuses = new Set(['completed', 'done']);

const adminColumns = [
	{ key: 'id', label: 'ID', width: '140px' },
	{ key: 'name', label: 'Họ tên' },
	{ key: 'email', label: 'Email', width: '230px' },
	{ key: 'role', label: 'Vai trò', width: '120px' },
	{ key: 'status', label: 'Trạng thái', width: '130px' },
	{ key: 'actions', label: 'Thao tác', width: '120px', align: 'center' },
];

const doctorPatientColumns = [
	{ key: 'patientId', label: 'Mã bệnh nhân', width: '150px' },
	{ key: 'patientName', label: 'Tên bệnh nhân' },
	{ key: 'bookedCount', label: 'Số lịch đã đặt', width: '140px', align: 'right' },
	{ key: 'completedCount', label: 'Số lần đã khám', width: '140px', align: 'right' },
	{ key: 'lastAppointmentAt', label: 'Lịch gần nhất', width: '180px' },
	{ key: 'actions', label: 'Thao tác', width: '120px', align: 'center' },
];

const adminTotalPages = computed(() => Math.max(1, Math.ceil((adminUsers.total || 0) / pageSize.value)));

const doctorPatients = computed(() => {
	const byPatientId = new Map();

	for (const item of doctorPatientsRaw.value) {
		const patientIdValue = String(item?.patientId || '').trim();
		if (!patientIdValue) continue;

		const rawDate = item?.startAt || item?.appointmentDate || item?.scheduledAt || null;
		const parsedDate = rawDate ? new Date(rawDate) : null;
		const dateValue = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
		const normalizedStatus = String(item?.status || '').trim().toLowerCase();

		if (!byPatientId.has(patientIdValue)) {
			byPatientId.set(patientIdValue, {
				patientId: patientIdValue,
				patientName: item?.patientName || item?.patientFullName || item?.patient?.fullName || patientIdValue,
				bookedCount: 0,
				completedCount: 0,
				lastAppointmentAt: dateValue,
			});
		}

		const bucket = byPatientId.get(patientIdValue);
		bucket.bookedCount += 1;
		if (completedAppointmentStatuses.has(normalizedStatus)) {
			bucket.completedCount += 1;
		}
		if (dateValue && (!bucket.lastAppointmentAt || dateValue > bucket.lastAppointmentAt)) {
			bucket.lastAppointmentAt = dateValue;
		}
	}

	return Array.from(byPatientId.values()).sort((a, b) => {
		const timeA = a.lastAppointmentAt ? a.lastAppointmentAt.getTime() : 0;
		const timeB = b.lastAppointmentAt ? b.lastAppointmentAt.getTime() : 0;
		return timeB - timeA;
	});
});

const filteredDoctorPatients = computed(() => {
	const keyword = String(doctorPatientSearch.value || '').trim().toLowerCase();
	if (!keyword) return doctorPatients.value;

	return doctorPatients.value.filter((item) => {
		const id = String(item.patientId || '').toLowerCase();
		const name = String(item.patientName || '').toLowerCase();
		return id.includes(keyword) || name.includes(keyword);
	});
});

const doctorPatientsTotalPages = computed(() => {
	const size = Math.max(1, Number(doctorPatientsPageSize.value) || 10);
	return Math.max(1, Math.ceil(filteredDoctorPatients.value.length / size));
});

const pagedDoctorPatients = computed(() => {
	const size = Math.max(1, Number(doctorPatientsPageSize.value) || 10);
	const currentPage = Math.min(Math.max(1, Number(doctorPatientsPage.value) || 1), doctorPatientsTotalPages.value);
	const start = (currentPage - 1) * size;
	return filteredDoctorPatients.value.slice(start, start + size);
});

const updateProfile = async () => {
	await patients.updateProfile(profile);
};

const loadRecords = async () => patients.loadRecords(patientId.value ? { patientId: patientId.value } : {});

const refreshAdminPatients = async () => {
	await adminUsers.fetchUsers({
		role: 'patient',
		query: searchText.value,
		page: adminPage.value,
		pageSize: pageSize.value,
	});
};

const formatDoctorDateTime = (value) => {
	const date = value instanceof Date ? value : new Date(value || '');
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleString('vi-VN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const loadDoctorPatientsList = async () => {
	if (!isDoctor.value) return;

	doctorPatientsLoading.value = true;
	doctorPatientsError.value = '';
	try {
		const actorDoctorId = auth.doctorId || auth.userId;
		const batchSize = 200;
		const firstPage = await doctorApi.getSchedule(auth.token, {
			doctorId: actorDoctorId,
			page: 1,
			pageSize: batchSize,
		});

		const firstItems = Array.isArray(firstPage?.appointments) ? firstPage.appointments : [];
		const total = Number(firstPage?.total) || firstItems.length;
		const effectiveBatchSize = Math.max(1, Number(firstPage?.pageSize) || batchSize);
		const totalPages = Math.max(1, Math.ceil(total / effectiveBatchSize));

		const merged = [...firstItems];
		for (let page = 2; page <= totalPages; page += 1) {
			const pageResult = await doctorApi.getSchedule(auth.token, {
				doctorId: actorDoctorId,
				page,
				pageSize: effectiveBatchSize,
			});
			const pageItems = Array.isArray(pageResult?.appointments) ? pageResult.appointments : [];
			merged.push(...pageItems);
		}

		doctorPatientsRaw.value = merged;
	} catch (error) {
		doctorPatientsRaw.value = [];
		doctorPatientsError.value = error?.message || 'Không thể tải danh sách bệnh nhân của bác sĩ.';
	} finally {
		doctorPatientsLoading.value = false;
	}
};

const goPrevDoctorPatientsPage = () => {
	if (doctorPatientsPage.value <= 1) return;
	doctorPatientsPage.value -= 1;
};

const goNextDoctorPatientsPage = () => {
	if (doctorPatientsPage.value >= doctorPatientsTotalPages.value) return;
	doctorPatientsPage.value += 1;
};

const openDoctorPatientRecord = async (row) => {
	patientId.value = row?.patientId || '';
	await loadRecords();
};

const isPatientDisabled = (row) => ['disabled', 'inactive'].includes(String(row?.status || '').toLowerCase());

const formatStatus = (value) => {
	const status = String(value || '').toLowerCase();
	if (status === 'active') return 'Hoạt động';
	if (status === 'verified') return 'Đã xác thực';
	if (status === 'disabled') return 'Đã khóa';
	if (status === 'inactive') return 'Không hoạt động';
	if (status === 'pending') return 'Chờ duyệt';
	return value || '-';
};

const patientStatusBadgeClass = (value) => {
	const status = String(value || '').toLowerCase();
	if (status === 'active' || status === 'verified') return 'is-ok';
	if (status === 'pending') return 'is-warn';
	if (status === 'disabled' || status === 'inactive') return 'is-off';
	return 'is-neutral';
};

const togglePatientStatus = async (row) => {
	const nextAction = isPatientDisabled(row) ? 'enable' : 'disable';
	await adminUsers.updateUserStatus(row.id, nextAction);
};

const viewPatientRecords = (row) => {
	router.push({ path: '/admin/records', query: { patientId: row.id } });
};

const goPrevAdminPage = async () => {
	if (adminPage.value <= 1) return;
	adminPage.value -= 1;
	await refreshAdminPatients();
};

const goNextAdminPage = async () => {
	if (adminPage.value >= adminTotalPages.value) return;
	adminPage.value += 1;
	await refreshAdminPatients();
};

const jumpToAdminPage = async () => {
	const requestedPage = Math.floor(Number(quickPageInput.value) || 1);
	const nextPage = Math.min(Math.max(requestedPage, 1), adminTotalPages.value);
	quickPageInput.value = nextPage;
	if (nextPage === adminPage.value) return;
	adminPage.value = nextPage;
	await refreshAdminPatients();
};

watch([searchText, pageSize], async () => {
	if (isRefreshingAdmin.value) return;
	adminPage.value = 1;
	if (isAdmin.value) {
		await refreshAdminPatients();
	}
});

watch(
	() => adminPage.value,
	(page) => {
		quickPageInput.value = Math.max(1, Number(page) || 1);
	},
	{ immediate: true }
);

watch(adminTotalPages, (pages) => {
	if (adminPage.value > pages) {
		adminPage.value = pages;
	}
	if (quickPageInput.value > pages) {
		quickPageInput.value = pages;
	}
	if (quickPageInput.value < 1) {
		quickPageInput.value = 1;
	}
});

watch([doctorPatientSearch, doctorPatientsPageSize], () => {
	doctorPatientsPage.value = 1;
});

watch(doctorPatientsTotalPages, (pages) => {
	if (doctorPatientsPage.value > pages) {
		doctorPatientsPage.value = pages;
	}
	if (doctorPatientsPage.value < 1) {
		doctorPatientsPage.value = 1;
	}
});

const handleRefresh = async () => {
	if (isAdmin.value) {
		isRefreshingAdmin.value = true;
		try {
			searchText.value = '';
			pageSize.value = 10;
			adminPage.value = 1;
			quickPageInput.value = 1;
			await refreshAdminPatients();
		} finally {
			isRefreshingAdmin.value = false;
		}
		return;
	}

	if (isDoctor.value) {
		await loadDoctorPatientsList();
	}

	await loadRecords();
};

onMounted(async () => {
	if (isAdmin.value) {
		await refreshAdminPatients();
		return;
	}

	if (isDoctor.value) {
		await loadDoctorPatientsList();
	}
});
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

.doctor-kpi-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
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

.kpi-label {
	margin: 0;
	color: #475569;
}

.kpi-value {
	margin: 0;
	font-size: 34px;
	line-height: 1.1;
	font-weight: 700;
	color: #0f172a;
}

.kpi-value.code {
	font-size: 24px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
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

.two { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.list-grid { margin-top: 14px; }

.toolbar {
	display: grid;
	gap: 12px;
	grid-template-columns: 1fr 150px auto;
	margin-bottom: 14px;
}

.patients-table-wrap :deep(.data-table) {
	table-layout: fixed;
}

.patients-table-wrap :deep(.data-table th),
.patients-table-wrap :deep(.data-table td) {
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

.table-actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	align-items: center;
	gap: 4px;
	width: 100%;
}

.table-actions.single-action {
	grid-template-columns: 1fr;
}

.table-actions button {
	min-width: 0;
	height: 38px;
	min-height: 38px;
	max-height: 38px;
	padding: 6px 6px;
	font-size: 12px;
}

.pagination {
	margin-top: 14px;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	flex-wrap: wrap;
}

.pager-inline-label {
	font-size: 12px;
	font-weight: 600;
	color: #475569;
	height: 44px;
	display: inline-flex;
	align-items: center;
}

.pager-field {
	width: 84px;
	min-width: 84px;
}

.pager-btn {
	min-width: 72px;
	height: 44px;
	min-height: 44px;
	max-height: 44px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.pagination-status {
	display: inline-flex;
	align-items: center;
	height: 44px;
	padding: 0 12px;
	border: 1px solid #cbd5e1;
	background: #f8fafc;
	font-weight: 600;
	color: #334155;
}

.status-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 26px;
	padding: 0 10px;
	max-width: 100%;
	border: 1px solid transparent;
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.status-badge.is-ok {
	background: #ecfdf5;
	border-color: #86efac;
	color: #166534;
}

.status-badge.is-warn {
	background: #fffbeb;
	border-color: #fcd34d;
	color: #92400e;
}

.status-badge.is-off {
	background: #fef2f2;
	border-color: #fca5a5;
	color: #991b1b;
}

.status-badge.is-neutral {
	background: #f8fafc;
	border-color: #cbd5e1;
	color: #334155;
}

.doctor-item {
	border: 1px solid #dbe2ea;
	border-radius: 12px;
	background: #f8fafc;
	padding: 14px;
}

.doctor-item p {
	margin: 0 0 6px;
	color: #334155;
}

@media (max-width: 1100px) {
	.header-copy h1 {
		font-size: 28px;
	}

	.doctor-kpi-grid {
		grid-template-columns: 1fr;
	}

	.toolbar {
		grid-template-columns: 1fr;
	}
}
</style>

