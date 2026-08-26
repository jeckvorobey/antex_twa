<template>
  <section v-for="group in groups" :key="group.label" class="app-history-group q-mb-md">
    <div class="app-group-label app-group-label--history q-mb-sm">{{ group.label }}</div>

    <OrderCard
      v-for="item in group.items"
      :key="item.id"
      :order="item"
      mode="user"
      class="app-history-card app-card-shadow"
      @repeat="emit('repeat', item)"
    />
  </section>
</template>

<script setup lang="ts">
import OrderCard from '@components/orders/OrderCard.vue';
import type { GroupedOrders, MiniappOrderItem } from '@types/miniapp';

defineProps<{
  groups: GroupedOrders[];
}>();

const emit = defineEmits<{
  repeat: [order: MiniappOrderItem];
}>();
</script>
