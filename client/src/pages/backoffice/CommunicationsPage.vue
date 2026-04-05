<template>
  <div class="communications page" :class="{ 'doctor-mode': isDoctor }">
    <header class="panel workspace-header">
      <div class="header-copy">
        <p class="eyebrow">SECURE MESSAGING</p>
        <h1>Trao đổi</h1>
        <p>
          {{
            isDoctor
              ? 'Gửi trao đổi chuyên môn tới bệnh nhân theo đúng luồng hồ sơ điều trị.'
              : 'Gửi tin nhắn an toàn đến bác sĩ phụ trách của bạn.'
          }}
        </p>
      </div>

      <div class="header-actions">
        <span class="role-chip">{{ isDoctor ? 'Vai trò: Bác sĩ' : isPatient ? 'Vai trò: Bệnh nhân' : 'Vai trò: Khách' }}</span>
      </div>
    </header>

    <section class="communications-grid">
      <article class="panel compose-panel">
        <div class="section-head">
          <h2>Soạn tin nhắn</h2>
          <small>{{ isDoctor ? 'Chuyển tiếp hướng dẫn điều trị' : 'Gửi yêu cầu tư vấn' }}</small>
        </div>

        <form class="grid two" @submit.prevent="sendMessage">
          <label class="field" v-if="isPatient">
            <span>Mã bác sĩ</span>
            <input v-model="payload.doctorId" required placeholder="Mã bác sĩ" />
          </label>

          <label class="field" v-if="isDoctor">
            <span>Mã bệnh nhân</span>
            <input v-model="payload.patientId" required placeholder="Mã bệnh nhân" />
          </label>

          <label class="field" v-if="isPatient">
            <span>Tiêu đề</span>
            <input v-model="payload.subject" placeholder="Ví dụ: Xin tư vấn kết quả xét nghiệm" />
          </label>

          <label class="field full-row">
            <span>Nội dung</span>
            <textarea
              v-model="payload.message"
              required
              rows="5"
              :placeholder="isDoctor ? 'Nội dung hướng dẫn, dặn dò hoặc phản hồi kết quả...' : 'Nội dung câu hỏi của bạn'"
            ></textarea>
          </label>

          <div class="full-row actions">
            <button type="submit">{{ isDoctor ? 'Gửi cho bệnh nhân' : 'Gửi cho bác sĩ' }}</button>
          </div>
        </form>
      </article>

      <article v-if="isDoctor" class="panel doctor-notes">
        <div class="section-head">
          <h2>Checklist trước khi gửi</h2>
          <small>Tăng độ rõ ràng và tránh sai sót trao đổi</small>
        </div>

        <ul class="tips-list">
          <li>Nêu rõ ngữ cảnh: lịch hẹn hoặc kết quả xét nghiệm liên quan.</li>
          <li>Viết hướng dẫn ngắn gọn, có mốc thời gian nếu cần tái khám.</li>
          <li>Tránh viết tắt chuyên môn khó hiểu với bệnh nhân.</li>
          <li>Thêm cảnh báo nếu có dấu hiệu cần đến cơ sở y tế ngay.</li>
        </ul>
      </article>
    </section>

    <section class="panel">
      <div class="section-head">
        <h2>Lịch sử trao đổi</h2>
        <small>{{ historyRows.length }} bản ghi gần nhất</small>
      </div>

      <p v-if="historyLoading" class="muted">Đang tải lịch sử trao đổi...</p>
      <p v-else-if="historyRows.length === 0" class="muted">Chưa có lịch sử trao đổi phù hợp bộ lọc hiện tại.</p>

      <div v-else class="list-grid">
        <article v-for="item in historyRows" :key="item.key" class="item history-item">
          <p><strong>{{ item.targetLabel }}</strong></p>
          <p>{{ item.directionLabel }}</p>
          <p>{{ item.when }}</p>
          <p>{{ item.preview }}</p>
        </article>
      </div>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useRoleVisibility } from '../../composables/useRoleVisibility.js';
import { fetchMessagesByRole, sendMessageByRole } from '../../stores/helpers/communicationsRoleApi.js';

const auth = useAuthStore();
const { isDoctor, isPatient, role } = useRoleVisibility(auth);
const status = ref('');
const error = ref('');
const historyLoading = ref(false);
const messageHistory = ref([]);

const HISTORY_LIMIT = 30;

const payload = reactive({ doctorId: '', patientId: '', subject: '', message: '' });

const activeConversationId = computed(() => {
  if (isDoctor.value) return String(payload.patientId || '').trim();
  if (isPatient.value) return String(payload.doctorId || '').trim();
  return '';
});

const historyRows = computed(() => {
  const currentRole = role.value;
  const filterPartnerId = activeConversationId.value;

  const sorted = [...messageHistory.value].sort((a, b) => {
    const ta = new Date(a?.createdAt || a?.sentAt || 0).getTime();
    const tb = new Date(b?.createdAt || b?.sentAt || 0).getTime();
    return tb - ta;
  });

  return sorted
    .filter((item) => {
      if (!filterPartnerId) return true;
      const partnerId = isDoctor.value
        ? item?.toPatientId || item?.fromPatientId || ''
        : item?.toDoctorId || item?.fromDoctorId || '';
      return String(partnerId || '').trim() === filterPartnerId;
    })
    .map((item, index) => {
      const createdAtRaw = item?.createdAt || item?.sentAt || null;
      const createdAt = new Date(createdAtRaw || '');
      const when = Number.isNaN(createdAt.getTime())
        ? '-'
        : createdAt.toLocaleString('vi-VN');

      const targetId = isDoctor.value
        ? item?.toPatientId || item?.fromPatientId || ''
        : item?.toDoctorId || item?.fromDoctorId || '';

      const targetLabel = isDoctor.value
        ? `Benh nhan: ${targetId || 'Chua ro'}`
        : `Bac si: ${targetId || 'Chua ro'}`;

      const directionLabel = currentRole === 'doctor'
        ? item?.fromDoctorId
          ? 'Ban -> Benh nhan'
          : 'Benh nhan -> Ban'
        : item?.fromPatientId
          ? 'Ban -> Bac si'
          : 'Bac si -> Ban';

      return {
        key: item?.id || `${createdAtRaw || 'unknown'}-${index}`,
        targetLabel,
        directionLabel,
        when,
        preview: String(item?.content || item?.message || '').slice(0, 200) || '(khong co noi dung)',
      };
    })
    .slice(0, HISTORY_LIMIT);
});

const loadMessageHistory = async () => {
  historyLoading.value = true;
  try {
    const response = await fetchMessagesByRole({
      role: role.value,
      token: auth.token,
      userId: auth.userId,
      filters: {
        limit: HISTORY_LIMIT,
      },
    });
    messageHistory.value = Array.isArray(response?.messages) ? response.messages : [];
  } catch (e) {
    messageHistory.value = [];
    error.value = e?.message || 'Không thể tải lịch sử trao đổi.';
  } finally {
    historyLoading.value = false;
  }
};

const sendMessage = async () => {
  error.value = '';
  status.value = '';

  const sent = await sendMessageByRole({
    role: role.value,
    token: auth.token,
    userId: auth.userId,
    payload,
  });

  if (!sent) {
    error.value = 'Vai trò hiện tại không hỗ trợ gửi tin nhắn.';
    return;
  }

  status.value = 'Gửi tin nhắn thành công.';

  await loadMessageHistory();

  payload.message = '';
  if (isPatient.value) {
    payload.subject = '';
  }
};

onMounted(() => {
  loadMessageHistory();
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

.role-chip {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}

.communications-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 16px;
}

.two {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.full-row {
  grid-column: 1 / -1;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #334155;
  font-weight: 600;
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

.actions {
  display: flex;
  justify-content: flex-start;
}

.doctor-notes {
  background: linear-gradient(120deg, #f8fafc 0%, #eef2ff 100%);
}

.tips-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
  color: #334155;
}

.history-item {
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #f8fafc;
  padding: 14px;
}

.history-item p {
  margin: 0 0 6px;
  color: #334155;
}

@media (max-width: 1200px) {
  .header-copy h1 {
    font-size: 28px;
  }

  .communications-grid {
    grid-template-columns: 1fr;
  }
}
</style>

