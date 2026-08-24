<template>
  <section class="manager-order-details antex-border-gold">
    <h2 class="manager-order-details__title">{{ t('manager.orderDetails.title') }}</h2>
    <dl class="manager-order-details__list">
      <div v-if="customerName" class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.customer') }}</dt>
        <dd>{{ customerName }}</dd>
      </div>
      <div class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.direction') }}</dt>
        <dd>{{ order.currencySell }} → {{ order.currencyBuy }}</dd>
      </div>
      <div class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.sell') }}</dt>
        <dd>{{ formatManagerAmount(order.amountSell) }} {{ order.currencySell }}</dd>
      </div>
      <div class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.buy') }}</dt>
        <dd>{{ formatManagerAmount(order.amountBuy) }} {{ order.currencyBuy }}</dd>
      </div>
      <div class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.country') }}</dt>
        <dd>{{ countryLabel }}</dd>
      </div>
      <div v-if="order.city" class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.city') }}</dt>
        <dd>{{ order.city.name }}</dd>
      </div>
      <div class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.receiveMethod') }}</dt>
        <dd>{{ receiveMethod }}</dd>
      </div>
      <div class="manager-order-details__row">
        <dt>{{ t('manager.orderDetails.createdAt') }}</dt>
        <dd>{{ createdAtLabel }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ManagerOrderSummary } from '@types/manager-chat';
import { formatManagerAmount, managerUserFullName } from '@utils/manager-chat';

const props = defineProps<{ order: ManagerOrderSummary }>();
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
  return te(key) ? t(key) : props.order.city?.countryRuName || props.order.country;
});

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
