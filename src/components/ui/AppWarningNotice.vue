<template>
  <q-banner class="app-warning-notice rounded-borders q-px-md q-py-sm" rounded>
    <template #avatar>
      <q-icon name="warning" size="26px" class="text-warning" />
    </template>

    <div class="text-body2 text-weight-medium">
      <slot />
    </div>
  </q-banner>
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
