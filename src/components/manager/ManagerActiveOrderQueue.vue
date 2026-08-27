<template>
  <AntexCard :elevated="false" class="manager-active-order-queue">
    <template v-for="(order, index) in orders.slice(0, 4)" :key="order.id">
      <ManagerActiveOrderQueueItem :order="order" @select="emit('select', order.id)" />
      <q-separator
        v-if="index < Math.min(orders.length, 4) - 1"
        class="manager-active-order-queue__separator"
      />
    </template>
    <q-btn
      v-if="orders.length > 4"
      flat
      round
      icon="open_in_full"
      class="manager-active-order-queue__expand"
      :aria-label="viewAllLabel"
      @click.stop="emit('viewAll')"
    >
      <q-tooltip>{{ viewAllLabel }}</q-tooltip>
    </q-btn>
  </AntexCard>
</template>

<script setup lang="ts">
import ManagerActiveOrderQueueItem from '@components/manager/ManagerActiveOrderQueueItem.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import type { ManagerOrderSummary } from '@types/manager-chat';

defineProps<{ orders: ManagerOrderSummary[]; viewAllLabel: string }>();
const emit = defineEmits<{ select: [orderId: number]; viewAll: [] }>();
</script>
