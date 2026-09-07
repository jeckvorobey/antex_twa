<template>
  <div v-if="hasMore || error" class="row justify-center q-py-md">
    <q-btn
      flat
      no-caps
      color="primary"
      :label="t(error ? 'common.retry' : 'nav.more')"
      :loading="loading"
      :disable="loading"
      @click="emit('load')"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{ hasMore: boolean; loading: boolean; error: boolean }>();
const emit = defineEmits<{ load: [] }>();
const { t } = useI18n();
</script>
