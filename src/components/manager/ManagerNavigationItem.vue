<template>
  <q-item
    clickable
    :active="active"
    active-class="manager-navigation-item--active"
    class="manager-navigation-item"
    :data-navigation-name="item.name"
    :aria-current="active ? 'page' : undefined"
    @click="emit('select')"
  >
    <q-item-section avatar>
      <q-icon :name="item.icon" aria-hidden="true" />
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ item.label }}</q-item-label>
    </q-item-section>
    <q-item-section v-if="badge" side>
      <q-badge rounded class="manager-navigation-item__badge" :label="badge" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { MiniappNavigationItem } from '@types/miniapp';

defineProps<{
  item: MiniappNavigationItem;
  active: boolean;
  badge: string | number | null;
}>();

const emit = defineEmits<{
  select: [];
}>();
</script>
