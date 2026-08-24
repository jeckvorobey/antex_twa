<template>
  <q-banner
    v-if="visible"
    :class="['antex-notice', `antex-notice--${tone}`]"
    :role="tone === 'warning' ? 'alert' : 'status'"
    rounded
  >
    <template #avatar>
      <q-icon :name="iconName" aria-hidden="true" />
    </template>
    <div v-if="$slots.title" class="antex-notice__title"><slot name="title" /></div>
    <div class="antex-notice__body"><slot /></div>
    <template v-if="dismissible" #action>
      <q-btn
        flat
        round
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
const iconName = computed(() =>
  props.tone === 'warning' ? 'warning' : props.tone === 'offline' ? 'schedule' : 'info',
);

function dismiss(): void {
  visible.value = false;
  emit('dismiss');
}
</script>
