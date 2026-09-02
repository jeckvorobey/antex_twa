<template>
  <q-banner
    v-if="visible"
    :class="['antex-notice', `antex-notice--${tone}`]"
    :role="tone === 'warning' ? 'alert' : 'status'"
    inline-actions
    rounded
  >
    <template #avatar>
      <q-icon :name="iconName" :size="iconSize" aria-hidden="true" />
    </template>
    <div class="antex-notice__layout">
      <div class="antex-notice__copy">
        <div v-if="$slots.title" class="antex-notice__title"><slot name="title" /></div>
        <div class="antex-notice__body"><slot /></div>
      </div>
      <div v-if="$slots.aside" class="antex-notice__aside"><slot name="aside" /></div>
    </div>
    <template v-if="dismissible" #action>
      <q-btn
        flat
        round
        dense
        icon="close"
        :aria-label="dismissLabel"
        class="antex-notice__dismiss"
        @click="dismiss"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export type AntexNoticeTone = 'warning' | 'offline' | 'info';

const props = withDefaults(
  defineProps<{ tone?: AntexNoticeTone; dismissible?: boolean; dismissLabel?: string }>(),
  { tone: 'info', dismissible: false, dismissLabel: undefined },
);
const emit = defineEmits<{ dismiss: [] }>();
const visible = ref(true);
const iconSize = computed(() =>
  props.tone === 'warning' ? '32px' : props.tone === 'offline' ? '30px' : '24px',
);
const iconName = computed(() =>
  props.tone === 'warning'
    ? 'warning_amber'
    : props.tone === 'offline'
      ? 'schedule'
      : 'info_outline',
);

/** Закрывает только текущее предупреждение и сообщает об этом родителю. */
function dismiss(): void {
  visible.value = false;
  emit('dismiss');
}
</script>
