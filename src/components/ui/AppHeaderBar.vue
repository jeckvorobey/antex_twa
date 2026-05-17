<template>
  <div class="app-header-bar">
    <div class="app-header-bar__brand">
      <div class="app-header-bar__logo">
        <span>AE</span>
      </div>
      <div class="app-header-bar__title">{{ t('common.brand') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>
