<template>
  <q-banner class="app-warning-notice rounded-borders bg-warning q-px-md q-py-sm">
    <div class="app-warning-notice__body">
      <q-icon class="app-warning-notice__icon" name="warning" size="26px" />

      <div class="app-warning-notice__content">
        <slot />
      </div>
    </div>
  </q-banner>
</template>

<style scoped lang="scss">
.app-warning-notice {
  display: block;
  box-sizing: border-box;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--antex-gold-base);
  border-right-color: var(--antex-gold-base);
  border-left-color: var(--antex-gold-base);
  border-radius: 4px;
  outline: 1px solid var(--antex-gold-base);
  outline-offset: -1px;
  background: rgba(212, 175, 55, 0.14) !important;
  color: var(--antex-gold-light);
  box-shadow: none;
}

.app-warning-notice__body {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
}

.app-warning-notice__icon {
  flex: 0 0 auto;
}

.app-warning-notice__content {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
}
</style>
