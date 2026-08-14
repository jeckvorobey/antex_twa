<template>
  <article class="manager-order-card" :class="{ 'manager-order-card--compact': compact }">
    <div class="manager-order-card__topline">
      <span class="manager-order-card__number">#{{ order.publicNumber }}</span>
      <OrderStatusChip :status="order.status" />
    </div>
    <div class="manager-order-card__amounts">
      <div>
        <strong>{{ formatManagerAmount(order.amountSell) }}</strong>
        <span>{{ order.currencySell }}</span>
      </div>
      <q-icon name="south" size="18px" class="manager-order-card__arrow" />
      <div>
        <strong>{{ formatManagerAmount(order.amountBuy) }}</strong>
        <span>{{ order.currencyBuy }}</span>
      </div>
    </div>
    <div class="manager-order-card__meta">
      <span v-if="customerName">{{ customerName }}</span>
      <span>{{ receiveMethodLabel(order.methodGet) }}</span>
    </div>
    <div v-if="actions" class="manager-order-card__actions">
      <q-btn flat rounded no-caps label="Подробнее" icon="receipt_long" @click="$emit('openDetails')" />
      <q-btn
        unelevated
        rounded
        no-caps
        label="Открыть чат"
        icon="forum"
        class="manager-gold-button"
        @click="$emit('openChat')"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import OrderStatusChip from '@components/manager/OrderStatusChip.vue';
import type { ManagerOrderSummary } from '@types/manager-chat';
import { formatManagerAmount, managerUserDisplayName, receiveMethodLabel } from '@utils/manager-chat';

const props = withDefaults(
  defineProps<{
    order: ManagerOrderSummary;
    compact?: boolean;
    actions?: boolean;
  }>(),
  { compact: false, actions: false },
);

defineEmits<{
  openChat: [];
  openDetails: [];
}>();

const customerName = computed(() => (props.order.user ? managerUserDisplayName(props.order.user) : null));
</script>
