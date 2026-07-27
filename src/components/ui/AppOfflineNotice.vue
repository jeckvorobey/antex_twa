<template>
  <div class="app-offline-notice row no-wrap items-center q-gutter-x-sm" role="status">
    <div class="app-offline-notice__icon col-auto">
      <q-icon name="schedule" />
    </div>

    <div class="app-offline-notice__content col">
      <div class="app-offline-notice__title">
        <slot name="title" />
      </div>
      <div class="app-offline-notice__text"><slot /></div>
    </div>

    <div class="app-offline-notice__hours col-auto">
      {{ compactBusinessHours }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  businessHours: string;
}>();

const compactBusinessHours = computed(() =>
  props.businessHours.replace(/^Ежедневно\s+/i, '').trim(),
);
</script>

<style scoped lang="scss">
.app-offline-notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  box-sizing: border-box;
  min-height: clamp(58px, 16vw, 68px);
  overflow: hidden;
  border: 1px solid rgba(79, 190, 112, 0.75);
  border-radius: clamp(14px, 4.5vw, 18px);
  background:
    radial-gradient(circle at 12% 50%, rgba(87, 198, 119, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(31, 104, 69, 0.34), rgba(18, 67, 56, 0.74));
  box-shadow:
    inset 0 0 24px rgba(74, 197, 110, 0.06),
    0 0 18px rgba(74, 197, 110, 0.08);
}

.app-offline-notice__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(34px, 10vw, 42px);
  height: clamp(34px, 10vw, 42px);
  color: var(--antex-gold-light);
  filter: drop-shadow(0 0 7px rgba(242, 210, 122, 0.24));
}

.app-offline-notice__icon :deep(.q-icon) {
  font-size: clamp(34px, 10vw, 42px);
}

.app-offline-notice__content {
  min-width: 0;
}

.app-offline-notice__title {
  margin-bottom: 1px;
  color: #f7f1dd;
  font-size: clamp(12px, 3.5vw, 15px);
  font-weight: 700;
  line-height: 1.25;
}

.app-offline-notice__text {
  color: rgba(255, 255, 255, 0.76);
  font-size: clamp(11px, 3.1vw, 13px);
  line-height: 1.3;
  white-space: nowrap;
}

.app-offline-notice__hours {
  padding: clamp(6px, 1.8vw, 8px) clamp(9px, 2.8vw, 12px);
  border-radius: 999px;
  background: rgba(36, 107, 84, 0.48);
  color: rgba(255, 255, 255, 0.88);
  font-size: clamp(10px, 2.9vw, 12px);
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 340px) {
  .app-offline-notice__hours {
    padding-inline: 7px;
    font-size: 9.5px;
  }
}
</style>
