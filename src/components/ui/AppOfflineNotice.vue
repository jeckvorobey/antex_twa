<template>
  <div class="app-offline-notice row no-wrap items-center" role="status">
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
      {{ businessHours }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  businessHours: string;
}>();
</script>

<style scoped lang="scss">
.app-offline-notice {
  box-sizing: border-box;
  min-height: 72px;
  gap: 14px;
  padding: 14px 16px;
  overflow: hidden;
  border: 1px solid rgba(79, 190, 112, 0.75);
  border-radius: 16px;
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
  width: 44px;
  height: 44px;
  color: var(--antex-gold-light);
  filter: drop-shadow(0 0 7px rgba(242, 210, 122, 0.24));
}

.app-offline-notice__icon :deep(.q-icon) {
  font-size: 44px;
}

.app-offline-notice__content {
  min-width: 0;
}

.app-offline-notice__title {
  margin-bottom: 3px;
  color: #f7f1dd;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.app-offline-notice__text {
  color: rgba(255, 255, 255, 0.76);
  font-size: 14px;
  line-height: 1.4;
}

.app-offline-notice__hours {
  max-width: 42%;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(36, 107, 84, 0.48);
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  text-align: center;
  white-space: normal;
}

@media (max-width: 370px) {
  .app-offline-notice {
    gap: 10px;
    padding: 12px;
  }

  .app-offline-notice__icon {
    width: 38px;
    height: 38px;
  }

  .app-offline-notice__icon :deep(.q-icon) {
    font-size: 38px;
  }

  .app-offline-notice__hours {
    max-width: 38%;
    padding: 7px 9px;
    font-size: 12px;
  }
}
</style>
