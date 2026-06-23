<template>
  <div class="app-warning-notice row no-wrap items-start" role="alert">
    <div class="app-warning-notice__icon col-auto self-center q-px-sm">
      <q-icon name="warning" class="text-warning" size="2.5rem" />
    </div>

    <div class="app-warning-notice__content col text-body2 text-weight-medium">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-warning-notice {
  box-sizing: border-box;
  padding: 14px 16px;
  border: 1px solid var(--antex-gold-base) !important;
  border-radius: var(--antex-radius-card) !important;
  background: rgba(212, 175, 55, 0.14) !important;
  color: var(--antex-gold-light) !important;
  box-shadow: none;
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
