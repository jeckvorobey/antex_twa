<template>
  <div
    class="app-warning-notice row no-wrap items-start"
    role="alert"
  >
    <div class="app-warning-notice__icon col-auto self-start">
      <q-icon name="warning" size="26px" class="text-warning" />
    </div>

    <div class="app-warning-notice__content col text-body2 text-weight-medium">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-warning-notice {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--antex-gold-base);
  border-radius: var(--antex-radius-card);
  background: rgba(212, 175, 55, 0.14) !important;
  color: var(--antex-gold-light);
  box-shadow: none;
  gap: 12px;
  overflow: visible;
}

.app-warning-notice__icon {
  display: flex;
  flex: 0 0 auto;
}

.app-warning-notice__content {
  min-width: 0;
  line-height: 1.45;
  white-space: normal;
  word-break: normal;
  overflow-wrap: anywhere;
}
</style>
