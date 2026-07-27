<template>
  <div v-if="visible" class="app-warning-notice row no-wrap items-center q-px-sm" role="alert">
    <div class="app-warning-notice__icon col-auto">
      <q-icon name="warning" />
    </div>

    <div class="app-warning-notice__content col q-ml-sm">
      <div class="app-warning-notice__title">
        <slot name="title" />
      </div>
      <div class="app-warning-notice__text"><slot /></div>
    </div>
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
</script>

<style scoped lang="scss">
.app-warning-notice {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  box-sizing: border-box;
  min-height: clamp(68px, 19vw, 76px);
  overflow: hidden;
  border: 1px solid rgba(224, 160, 40, 0.92);
  border-radius: clamp(14px, 4.5vw, 18px);
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
  width: clamp(36px, 11vw, 44px);
  height: clamp(36px, 11vw, 44px);
  color: #f1a72a;
  filter: drop-shadow(0 0 8px rgba(232, 164, 36, 0.28));
}

.app-warning-notice__icon :deep(.q-icon) {
  font-size: clamp(36px, 11vw, 44px);
}

.app-warning-notice__content {
  min-width: 0;
}

.app-warning-notice__title {
  margin-bottom: 2px;
  font-size: clamp(11px, 3.2vw, 14px);
  font-weight: 700;
  line-height: 1.3;
  color: #f4edd6;
}

.app-warning-notice__text {
  font-size: clamp(11px, 3.1vw, 13px);
  font-weight: 400;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.78);
  white-space: normal;
  word-break: normal;
  overflow-wrap: anywhere;
}

.app-warning-notice__close {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 26px;
  min-width: 26px;
  height: 26px;
  min-height: 26px;
  padding: 0;
  color: rgba(212, 175, 55, 0.48);
}

.app-warning-notice__close :deep(.q-icon) {
  font-size: 18px;
}

@media (min-width: 430px) {
  .app-warning-notice {
    min-height: 82px;
  }
}
</style>
