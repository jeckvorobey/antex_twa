<template>
  <q-item
    :tag="clickable ? 'button' : 'div'"
    :clickable="clickable"
    :class="['antex-cell', { 'antex-cell--clickable': clickable }]"
    @click="handleClick"
  >
    <q-item-section v-if="$slots.before" avatar class="antex-cell__before">
      <slot name="before" />
    </q-item-section>
    <q-item-section>
      <q-item-label class="antex-cell__title">{{ title }}</q-item-label>
      <q-item-label v-if="description" caption class="antex-cell__description">
        {{ description }}
      </q-item-label>
      <slot />
    </q-item-section>
    <q-item-section v-if="$slots.after || clickable" side class="antex-cell__after">
      <slot name="after">
        <q-icon v-if="clickable" name="chevron_right" aria-hidden="true" />
      </slot>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ title: string; description?: string | null; clickable?: boolean }>(),
  { description: null, clickable: false },
);

const emit = defineEmits<{ click: [] }>();

function handleClick(): void {
  if (props.clickable) emit('click');
}
</script>
