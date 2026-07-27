<template>
  <div v-if="visible" class="app-warning-notice row no-wrap items-center" role="alert">
    <div class="app-warning-notice__icon col-auto">
      <q-icon name="warning" />
    </div>

    <div class="app-warning-notice__content col">
      <div class="app-warning-notice__title">
        <slot name="title" />
      </div>
      <div class="app-warning-notice__text"><slot /></div>
    </div>

    <q-btn
      v-if="dismissible"
      flat
      round
      dense
      icon="close"
      class="app-warning-notice__close"
      aria-label="Закрыть уведомление"
      @click="dismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    dismissible?: boolean;
  }>(),
  {
    dismissible: true,
  },
);

const emit = defineEmits<{
  dismiss: [];
}>();

const visible = ref(true);

function dismiss() {
  visible.value = false;
  emit('dismiss');
}
</script>

<style scoped lang="scss">
.app-warning-notice {
  position: relative;
  box-sizing: border-box;
  min-height: 96px;
  gap: 14px;
  padding: 16px 42px 16px 16px;
  overflow: hidden;
  border: 1px solid rgba(224, 160, 40, 0.92);
  border-radius: 16px;
  background:
    radial-gradient(circle at 12% 50%, rgba(232, 164, 36, 0.16), transparent 35%),
    linear-gradient(135deg, rgba(112, 72, 18, 0.2), rgba(20, 55, 47, 0.86));
  color: var(--antex-text-primary);
  box-shadow:
    inset 0 0 24px rgba(218, 151, 35, 0.05),
    0 0 20px rgba(218, 151, 35, 0.06);
}

.app-warning-notice__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  color: #f1a72a;
  filter: drop-shadow(0 0 8px rgba(232, 164, 36, 0.28));
}

.app-warning-notice__icon :deep(.q-icon) {
  font-size: 48px;
}

.app-warning-notice__content {
  min-width: 0;
}

.app-warning-notice__title {
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  color: #f4edd6;
}

.app-warning-notice__text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
  white-space: normal;
  word-break: normal;
  overflow-wrap: anywhere;
}

.app-warning-notice__close {
  position: absolute;
  top: 7px;
  right: 7px;
  color: rgba(212, 175, 55, 0.48);
}

.app-warning-notice__close :deep(.q-icon) {
  font-size: 22px;
}

@media (max-width: 370px) {
  .app-warning-notice {
    gap: 10px;
    padding-left: 12px;
  }

  .app-warning-notice__icon {
    width: 42px;
    height: 42px;
  }

  .app-warning-notice__icon :deep(.q-icon) {
    font-size: 42px;
  }
}
</style>
