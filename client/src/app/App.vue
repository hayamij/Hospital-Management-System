<template>
  <div class="app-shell">
    <RouterView />

    <div v-if="successOpen" class="success-backdrop" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <div class="success-modal">
        <h2 id="success-title">Thao tác thành công</h2>
        <p>{{ successMessage }}</p>
        <button type="button" class="success-confirm" @click="confirmSuccess">Xác nhận</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const successOpen = ref(false);
const successMessage = ref('');
const queuedMessages = [];

let observer = null;
let scheduledScan = false;

const showSuccessMessage = (message) => {
  const normalized = String(message || '').trim();
  if (!normalized) return;

  if (successOpen.value) {
    const latestQueued = queuedMessages[queuedMessages.length - 1];
    if (latestQueued !== normalized) {
      queuedMessages.push(normalized);
    }
    return;
  }

  successMessage.value = normalized;
  successOpen.value = true;
};

const consumeSuccessNodes = (root) => {
  if (typeof window === 'undefined') return;
  if (!(root instanceof Element || root instanceof Document)) return;

  const selector = '.msg.ok:not([data-success-popup-captured="1"])';
  const candidates = root.querySelectorAll(selector);

  candidates.forEach((node) => {
    node.setAttribute('data-success-popup-captured', '1');
    node.classList.add('success-popup-captured');
    showSuccessMessage(node.textContent || '');
  });

  if (root instanceof Element && root.matches(selector)) {
    root.setAttribute('data-success-popup-captured', '1');
    root.classList.add('success-popup-captured');
    showSuccessMessage(root.textContent || '');
  }
};

const scheduleConsumeDocument = () => {
  if (typeof window === 'undefined') return;
  if (scheduledScan) return;

  scheduledScan = true;
  window.requestAnimationFrame(() => {
    scheduledScan = false;
    consumeSuccessNodes(document);
  });
};

const confirmSuccess = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

onMounted(() => {
  if (typeof window === 'undefined') return;

  consumeSuccessNodes(document);

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          consumeSuccessNodes(node);
        }
      });
    });

    scheduleConsumeDocument();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  queuedMessages.length = 0;
});
</script>

<style>
.msg.ok.success-popup-captured {
  display: none !important;
}

.success-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.success-modal {
  width: min(460px, 100%);
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 20px;
  display: grid;
  gap: 12px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.2);
}

.success-modal h2 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.success-modal p {
  margin: 0;
  color: #334155;
  line-height: 1.5;
  white-space: pre-wrap;
}

.success-confirm {
  min-width: 132px;
  min-height: 42px;
  justify-self: end;
  border: 1px solid #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}
</style>
