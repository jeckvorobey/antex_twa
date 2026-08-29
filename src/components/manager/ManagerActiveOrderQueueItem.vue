<template>
  <article
    class="manager-active-order-queue-item"
    role="button"
    tabindex="0"
    @click="emit('select')"
    @keydown="selectFromKeyboard"
  >
    <div class="manager-active-order-queue-item__header">
      <strong>#{{ view.publicNumber }}</strong>
      <span class="manager-active-order-queue-item__time">{{ view.createdAt }}</span>
      <span
        :class="[
          'manager-active-order-queue-item__status',
          `manager-active-order-queue-item__status--${view.statusTone}`,
        ]"
        aria-hidden="true"
      />
      <span class="q-sr-only">{{ t(view.statusLabelKey) }}</span>
    </div>

    <OrderAmountFlow
      :currency-sell="view.currencySell"
      :amount-sell="view.amountSell"
      :currency-buy="view.currencyBuy"
      :amount-buy="view.amountBuy"
    />

    <div v-if="view.rateText" class="manager-active-order-queue-item__rate">
      {{ view.rateText }}
    </div>

    <div class="manager-active-order-queue-item__meta">{{ metaText }}</div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { toManagerOrderCard } from '@components/orders/order-card.adapters';
import OrderAmountFlow from '@components/orders/OrderAmountFlow.vue';
import type { ManagerOrderSummary } from '@types/manager-chat';

const props = defineProps<{ order: ManagerOrderSummary }>();
const emit = defineEmits<{ select: [] }>();
const { locale, t, te } = useI18n();
const view = computed(() => toManagerOrderCard(props.order, locale.value, t, te));
const metaText = computed(() =>
  [view.value.customerName, view.value.location, view.value.method].filter(Boolean).join(' · '),
);

function selectFromKeyboard(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  emit('select');
}
</script>
