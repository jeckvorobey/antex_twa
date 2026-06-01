<template>
  <div
    class="app-warning-notice row no-wrap items-start rounded-borders q-pa-md"
    role="alert"
  >
    <div class="col-auto self-start q-pr-md">
      <q-icon name="warning" size="26px" class="text-warning" />
    </div>

    <div class="col text-body2 text-weight-medium">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-warning-notice {
  max-width: 100%;
  border: 1px solid var(--antex-gold-base);
  background: rgba(212, 175, 55, 0.14) !important;
  color: var(--antex-gold-light);
  box-shadow: none;
}
</style>
