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

    <section class="panel" v-if="recentSent.length > 0">
      <div class="section-head">
        <h2>Lần gửi gần đây</h2>
        <small>{{ recentSent.length }} bản ghi trong phiên hiện tại</small>
      </div>

      <div class="list-grid">
        <article v-for="item in recentSent" :key="item.key" class="item history-item">
          <p><strong>{{ item.targetLabel }}</strong></p>
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
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useRoleVisibility } from '../composables/useRoleVisibility.js';
import { sendMessageByRole } from '../stores/helpers/communicationsRoleApi.js';

const auth = useAuthStore();
const { isDoctor, isPatient, role } = useRoleVisibility(auth);
const status = ref('');
const error = ref('');
const recentSent = ref([]);

const payload = reactive({ doctorId: '', patientId: '', subject: '', message: '' });

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

  const now = new Date().toLocaleString('vi-VN');
  const targetLabel = isDoctor.value
    ? `Benh nhan: ${payload.patientId || 'Chua ro'}`
    : `Bac si: ${payload.doctorId || 'Chua ro'}`;

  recentSent.value = [
    {
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      when: now,
      targetLabel,
      preview: String(payload.message || '').slice(0, 160) || '(khong co noi dung)',
    },
    ...recentSent.value,
  ].slice(0, 6);

  payload.message = '';
  if (isPatient.value) {
    payload.subject = '';
  }
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
