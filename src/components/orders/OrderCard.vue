<template>
  <AntexCard
    tag="article"
    :class="[
      'order-card',
      `order-card--${mode}`,
      {
        [`order-card--${density}`]: density !== 'default',
        'order-card--selectable': selectable,
        'manager-order-card': mode === 'manager',
      },
    ]"
    :data-order-card-mode="mode"
    :role="selectable ? 'button' : undefined"
    :tabindex="selectable ? 0 : undefined"
    @click="select"
    @keydown="selectFromKeyboard"
  >
    <div class="order-card__topline">
      <span class="order-card__number manager-order-card__number">#{{ view.publicNumber }}</span>
      <OrderStatus :status="order.status" />
    </div>
    <div v-if="view.customerName" class="order-card__customer manager-order-card__customer">
      {{ view.customerName }}
    </div>

    <OrderAmountFlow
      :currency-sell="view.currencySell"
      :amount-sell="view.amountSell"
      :currency-buy="view.currencyBuy"
      :amount-buy="view.amountBuy"
      result-prominent
    />

    <div v-if="view.rateText" class="order-card__rate manager-order-card__rate">
      {{ view.rateText }}
    </div>

    <div class="order-card__meta">
      <span class="order-card__location manager-order-card__location">
        <q-icon name="location_on" aria-hidden="true" />
        {{ view.location }}
      </span>
      <span v-if="view.method" class="order-card__method">
        <q-icon name="payments" aria-hidden="true" />
        {{ view.method }}
      </span>
    </div>

    <div class="order-card__bottom">
      <span class="order-card__time">
        <q-icon name="schedule" aria-hidden="true" />
        {{ view.createdAt }}
      </span>
      <div v-if="actions" class="order-card__actions manager-order-card__actions">
        <template v-if="mode === 'manager'">
          <q-btn
            flat
            round
            icon="receipt_long"
            class="order-card__action manager-order-card__action"
            :aria-label="t('manager.orders.actions.details')"
            @click="emit('openDetails')"
          >
            <q-tooltip>{{ t('manager.orders.actions.details') }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="forum"
            class="order-card__action order-card__action--chat"
            :aria-label="t('manager.orders.actions.chat')"
            @click="emit('openChat')"
          >
            <q-tooltip>{{ t('manager.orders.actions.chat') }}</q-tooltip>
          </q-btn>
        </template>
        <q-btn
          v-else
          flat
          round
          icon="autorenew"
          class="order-card__action app-history-card__repeat"
          :aria-label="t('history.repeat')"
          @click="emit('repeat')"
        >
          <q-tooltip>{{ t('history.repeat') }}</q-tooltip>
        </q-btn>
      </div>
    </div>
  </AntexCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  toManagerOrderCard,
  toUserOrderCard,
} from '@components/orders/order-card.adapters';
import type { OrderCardMode } from '@components/orders/order-card.model';
import OrderAmountFlow from '@components/orders/OrderAmountFlow.vue';
import OrderStatus from '@components/orders/OrderStatus.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import type { ManagerOrderSummary } from '@types/manager-chat';
import type { MiniappOrderItem } from '@types/miniapp';

const props = withDefaults(
  defineProps<{
    order: MiniappOrderItem | ManagerOrderSummary;
    mode: OrderCardMode;
    density?: 'default' | 'compact';
    actions?: boolean;
    selectable?: boolean;
  }>(),
  { density: 'default', actions: true, selectable: false },
);
const emit = defineEmits<{ repeat: []; openChat: []; openDetails: []; select: [] }>();
const { locale, t, te } = useI18n();

const view = computed(() =>
  props.mode === 'manager'
    ? toManagerOrderCard(props.order as ManagerOrderSummary, locale.value, t, te)
    : toUserOrderCard(props.order as MiniappOrderItem, locale.value, t, te),
);

function select(): void {
  if (props.selectable) emit('select');
}

function selectFromKeyboard(event: KeyboardEvent): void {
  if (!props.selectable || event.target !== event.currentTarget) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  emit('select');
}
</script>
