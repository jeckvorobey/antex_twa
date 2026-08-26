<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    :persistent="persistent"
    class="antex-bottom-sheet app-dialog--bottom"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <AntexCard
      ref="contentRef"
      elevated
      role="dialog"
      :aria-labelledby="$slots.title ? titleId : undefined"
      :aria-label="$slots.title ? undefined : ariaLabel"
      :class="['antex-bottom-sheet__surface', 'app-sheet', contentClass]"
      :style="[{ maxHeight }, contentStyle]"
      v-bind="$attrs"
    >
      <div v-if="draggable" class="antex-bottom-sheet__handle app-sheet-handle" aria-hidden="true" />
      <div v-if="$slots.title" :id="titleId" class="antex-bottom-sheet__title app-sheet__title">
        <slot name="title" />
      </div>
      <slot />
    </AntexCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CSSProperties, ComponentPublicInstance } from 'vue';

import AntexCard from '@components/ui/AntexCard.vue';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    persistent?: boolean;
    titleId?: string;
    ariaLabel?: string;
    maxHeight?: string;
    draggable?: boolean;
    contentClass?: string | string[] | Record<string, boolean>;
    contentStyle?: CSSProperties;
  }>(),
  {
    persistent: false,
    titleId: undefined,
    ariaLabel: undefined,
    maxHeight: 'min(82dvh, calc(100dvh - var(--antex-safe-area-top) - 24px))',
    draggable: true,
    contentClass: '',
    contentStyle: () => ({}),
  },
);
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const contentRef = ref<ComponentPublicInstance | null>(null);
const contentElement = computed(() => contentRef.value?.$el as HTMLElement | undefined);
defineExpose({ contentElement });
</script>
