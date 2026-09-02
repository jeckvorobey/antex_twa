<template>
  <AntexCard :elevated="false" class="manager-active-order-queue col-grow overflow-hidden">
    <div class="manager-active-order-queue__scroll scroll">
      <template v-for="(order, index) in orders" :key="order.id">
        <ManagerActiveOrderQueueItem :order="order" @select="emit('select', order.id)" />
        <q-separator
          v-if="index < orders.length - 1"
          class="manager-active-order-queue__separator"
        />
      </template>
      <slot name="pagination" />
    </div>
  </AntexCard>
</template>

<script setup lang="ts">
import ManagerActiveOrderQueueItem from '@components/manager/ManagerActiveOrderQueueItem.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import type { ManagerOrderSummary } from '@types/manager-chat';

defineProps<{ orders: ManagerOrderSummary[] }>();
const emit = defineEmits<{ select: [orderId: number] }>();
</script>
