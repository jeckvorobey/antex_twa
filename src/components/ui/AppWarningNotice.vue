<template>
  <div
    class="app-warning-notice row no-wrap items-start q-pa-md"
    role="alert"
  >
    <div class="col-auto self-start q-pr-md">
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
  border: 1px solid var(--antex-gold-base);
  border-radius: var(--antex-radius-card);
  background: rgba(212, 175, 55, 0.14) !important;
  color: var(--antex-gold-light);
  box-shadow: none;
  overflow: hidden;
}

.app-warning-notice__content {
  min-width: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
</style>
