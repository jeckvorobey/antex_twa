<template>
  <AntexCard
    tag="article"
    :class="[
      'order-card',
      `order-card--${mode}`,
      statusClass,
      {
        'order-card--compact': compact,
        'order-card--regular': !compact,
        'order-card--selectable': selectableCard,
      },
    ]"
    :data-order-card-mode="mode"
    :data-order-card-density="density"
    :data-order-card-status="order.status"
    :role="selectableCard ? 'button' : undefined"
    :tabindex="selectableCard ? 0 : undefined"
    @click="select"
    @keydown="selectFromKeyboard"
  >
    <div class="order-card__topline">
      <span class="order-card__number">#{{ view.publicNumber }}</span>
      <OrderStatus :status="order.status" />
    </div>
    <div v-if="view.customerName" class="order-card__customer">
      {{ view.customerName }}
    </div>

    <OrderAmountFlow
      :currency-sell="view.currencySell"
      :amount-sell="view.amountSell"
      :currency-buy="view.currencyBuy"
      :amount-buy="view.amountBuy"
      :rate-text="view.rateText"
    />

    <div class="order-card__meta">
      <span class="order-card__meta-line order-card__location">
        <q-icon name="location_on" aria-hidden="true" />
        <span class="order-card__meta-copy">{{ metaText }}</span>
      </span>
    </div>

    <div class="order-card__bottom">
      <span class="order-card__time">
        <q-icon name="schedule" aria-hidden="true" />
        {{ view.createdAt }}
      </span>
      <div v-if="visibleActions.length" class="order-card__actions">
        <q-btn
          v-for="action in visibleActions"
          :key="action.key"
          flat
          round
          padding="0"
          :class="['order-card__action', `order-card__action--${action.key}`]"
          :aria-label="t(action.labelKey)"
          :disable="isActionPending(action.key)"
          :loading="isActionPending(action.key)"
          @click.stop="emitAction(action.event)"
        >
          <span class="order-card__action-visual">
            <q-icon :name="action.icon" class="order-card__action-icon" aria-hidden="true" />
          </span>
          <q-tooltip>{{ t(action.labelKey) }}</q-tooltip>
        </q-btn>
      </div>
    </div>
  </AntexCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { toManagerOrderCard, toUserOrderCard } from '@components/orders/order-card.adapters';
import type { OrderCardMode } from '@components/orders/order-card.model';
import OrderAmountFlow from '@components/orders/OrderAmountFlow.vue';
import OrderStatus from '@components/orders/OrderStatus.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import type { ManagerOrderSummary } from '@types/manager-chat';
import type { MiniappOrderItem } from '@types/miniapp';

type OrderCardEvent = 'repeat' | 'cancel' | 'take' | 'complete' | 'openChat' | 'openDetails';

interface OrderCardAction {
  key: string;
  event: OrderCardEvent;
  icon: string;
  labelKey: string;
}

const props = withDefaults(
  defineProps<{
    order: MiniappOrderItem | ManagerOrderSummary;
    mode: OrderCardMode;
    compact?: boolean;
    actions?: boolean;
    pendingActions?: string[];
    selectable?: boolean;
  }>(),
  { compact: false, actions: true, pendingActions: () => [], selectable: false },
);
const emit = defineEmits<{
  repeat: [];
  cancel: [];
  take: [];
  complete: [];
  openChat: [];
  openDetails: [];
  select: [];
}>();
const { locale, t, te } = useI18n();

const view = computed(() =>
  props.mode === 'manager'
    ? toManagerOrderCard(props.order as ManagerOrderSummary, locale.value, t, te)
    : toUserOrderCard(props.order as MiniappOrderItem, locale.value, t, te),
);
const metaText = computed(() => [view.value.location, view.value.method].filter(Boolean).join(' · '));
const statusClass = computed(() => {
  const statusNames: Record<number, string> = {
    1: 'new',
    2: 'active',
    3: 'done',
    4: 'cancelled',
  };
  const statusName = statusNames[props.order.status];
  return statusName ? `order-card--status-${statusName}` : undefined;
});
const visibleActions = computed<OrderCardAction[]>(() => {
  if (!props.actions) return [];

  switch (props.order.status) {
    case 1:
      return props.mode === 'manager'
        ? [
            {
              key: 'take',
              event: 'take',
              icon: 'play_arrow',
              labelKey: 'manager.orderPage.actions.take',
            },
          ]
        : [];
    case 2:
      return props.mode === 'manager'
        ? [
            {
              key: 'chat',
              event: 'openChat',
              icon: 'chat_bubble_outline',
              labelKey: 'manager.orders.actions.chat',
            },
            {
              key: 'complete',
              event: 'complete',
              icon: 'check',
              labelKey: 'manager.orderPage.actions.complete',
            },
            {
              key: 'cancel',
              event: 'cancel',
              icon: 'close',
              labelKey: 'manager.orderPage.actions.cancel',
            },
          ]
        : [];
    case 3:
    case 4:
      return props.mode === 'user'
        ? [{ key: 'repeat', event: 'repeat', icon: 'autorenew', labelKey: 'history.repeat' }]
        : [];
    default:
      return [];
  }
});
const compact = computed(() => props.compact || visibleActions.value.length === 0);
const density = computed(() => (compact.value ? 'compact' : 'regular'));
const selectableCard = computed(() => props.selectable && visibleActions.value.length === 0);
const pendingActionKeys = computed(() => new Set(props.pendingActions));

function isActionPending(key: string): boolean {
  return pendingActionKeys.value.has(key);
}

function emitAction(event: OrderCardEvent): void {
  emit(event);
}

function select(): void {
  if (selectableCard.value) emit('select');
}

function selectFromKeyboard(event: KeyboardEvent): void {
  if (!selectableCard.value || event.target !== event.currentTarget) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  emit('select');
}
</script>
