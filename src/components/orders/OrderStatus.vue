<template>
  <AntexBadge
    class="order-card__status"
    kind="status"
    :tone="tone"
    :label="t(labelKey)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AntexBadge, { type AntexBadgeTone } from '@components/ui/AntexBadge.vue';
import { getStatusLabelKey, getStatusTone } from '@utils/miniapp';

const props = defineProps<{ status: number }>();
const { t } = useI18n();
const labelKey = computed(() => getStatusLabelKey(props.status));
const tone = computed(() => getStatusTone(props.status) as AntexBadgeTone);
</script>
