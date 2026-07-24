<template>
  <q-btn
    round
    flat
    dense
    icon="arrow_back"
    class="app-back-button"
    :aria-label="t('common.back')"
    @click="emit('click')"
  >
    <q-tooltip>{{ t('common.back') }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const emit = defineEmits<{ click: [] }>();
const { t } = useI18n();
</script>
