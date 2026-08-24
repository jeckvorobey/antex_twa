<template>
  <article
    class="manager-order-card antex-border-gold"
    :class="{ 'manager-order-card--compact': compact }"
  >
    <div class="manager-order-card__topline">
      <span class="manager-order-card__number">#{{ order.publicNumber }}</span>
      <OrderStatusChip :status="order.status" />
    </div>
    <div v-if="customerName" class="manager-order-card__customer">{{ customerName }}</div>
    <div class="manager-order-card__amounts">
      <div class="manager-order-card__amount">
        <AppCurrencyMark :mark="managerCurrencyMark(order.currencySell)" />
        <strong>{{ formatManagerAmount(order.amountSell) }}</strong>
        <span>{{ order.currencySell }}</span>
      </div>
      <q-icon name="arrow_forward" size="16px" class="manager-order-card__arrow" />
      <div class="manager-order-card__amount">
        <AppCurrencyMark :mark="managerCurrencyMark(order.currencyBuy)" />
        <strong>{{ formatManagerAmount(order.amountBuy) }}</strong>
        <span>{{ order.currencyBuy }}</span>
      </div>
    </div>
    <div class="manager-order-card__meta">
      <span class="manager-order-card__location">
        <q-icon name="location_on" size="15px" />
        {{ locationLabel }}
      </span>
      <span>
        <q-icon name="payments" size="15px" />
        {{ receiveMethod }}
      </span>
      <span>
        <q-icon name="schedule" size="15px" />
        {{ createdAtLabel }}
      </span>
    </div>
    <div v-if="actions" class="manager-order-card__actions">
      <q-btn
        flat
        round
        dense
        icon="receipt_long"
        class="manager-order-card__action manager-order-card__action--details"
        :aria-label="t('manager.orders.actions.details')"
        @click="$emit('openDetails')"
      >
        <q-tooltip>{{ t('manager.orders.actions.details') }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        round
        dense
        icon="forum"
        class="manager-order-card__action manager-order-card__action--chat"
        :aria-label="t('manager.orders.actions.chat')"
        @click="$emit('openChat')"
      >
        <q-tooltip>{{ t('manager.orders.actions.chat') }}</q-tooltip>
      </q-btn>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import OrderStatusChip from '@components/manager/OrderStatusChip.vue';
import AppCurrencyMark from '@components/ui/AppCurrencyMark.vue';
import type { ManagerOrderSummary } from '@types/manager-chat';
import {
  formatManagerAmount,
  managerCurrencyMark,
  managerUserFullName,
} from '@utils/manager-chat';

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

const { locale, t, te } = useI18n();

const customerName = computed(() => {
  if (!props.order.user) {
    return null;
  }
  return (
    managerUserFullName(props.order.user) ||
    t('manager.customerFallback', { id: props.order.user.id })
  );
});

const countryLabel = computed(() => {
  const key = `manager.countries.${props.order.country}`;
  if (te(key)) {
    return t(key);
  }
  return props.order.city?.countryRuName || props.order.country;
});

const locationLabel = computed(() =>
  props.order.city ? `${countryLabel.value}, ${props.order.city.name}` : countryLabel.value,
);

const receiveMethod = computed(() => {
  const key = `manager.receiveMethods.${props.order.methodGet}`;
  return te(key) ? t(key) : props.order.methodGet;
});

const createdAtLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(Date.parse(props.order.createdAt)),
);
</script>
