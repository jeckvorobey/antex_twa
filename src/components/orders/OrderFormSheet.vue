<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    class="app-dialog--bottom"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <AppSurface class="q-pa-md">
      <div class="app-sheet-handle" />
      <div class="text-h6 q-mb-xs">{{ t('order.title') }}</div>
      <div class="app-secondary-text q-mb-md">{{ t('order.description') }}</div>

      <div class="column q-gutter-md">
        <AppInputField
          v-model="amountSell"
          :label="t('order.amount')"
          type="number"
          min="1"
          :hint="minAmount > 0 ? t('order.minAmountHint', { amount: formatAmount(minAmount), currency: currencySell }) : undefined"
          :error="amountError"
        />

        <AppInputField
          v-model="currencyBuy"
          :label="t('order.currency')"
          :options="currencyOptions"
          type="select"
        />

        <AppInputField
          v-model="methodGet"
          :label="t('order.method')"
          :options="methodOptions"
          type="select"
        />

        <AppInputField
          v-model="contactTelegram"
          :label="t('order.contact')"
          type="text"
          :placeholder="t('order.contactPlaceholder')"
        />

        <AppButton block :loading="exchangeStore.submitting" :disable="!!amountError" @click="submit">
          {{ t('common.submit') }}
        </AppButton>
      </div>
    </AppSurface>
  </q-dialog>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppButton from '@components/ui/AppButton.vue';
import AppInputField from '@components/ui/AppInputField.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { getMinAmount } from '@constants/limits';
import { useAuthStore } from '@stores/auth.store';
import { useExchangeStore } from '@stores/exchange.store';
import { useOrdersStore } from '@stores/orders.store';
import { useUiStore } from '@stores/ui.store';
import { formatAmount } from '@utils/formatters';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const exchangeStore = useExchangeStore();
const ordersStore = useOrdersStore();
const uiStore = useUiStore();

const amountSell = ref<number | null>(null);
const currencyBuy = ref<string>('THB');
const methodGet = ref<string>('cash');
const contactTelegram = ref<string>('');

const currencySell = computed(() => uiStore.orderContext?.currencySell ?? 'RUB');

const availableMethods = computed(() => exchangeStore.quote?.availableMethods ?? ['cash']);

const methodOptions = computed(() => {
  const labels: Record<string, string> = {
    cash: t('methods.cash'),
    qrcode: t('methods.qrcode'),
    bank_account: t('methods.bank_account'),
    pay_services: t('methods.pay_services'),
  };
  return availableMethods.value.map((m) => ({
    label: labels[m] ?? m,
    value: m,
  }));
});

const minAmount = computed(() => getMinAmount(methodGet.value, currencySell.value));

const amountError = computed(() => {
  if (amountSell.value !== null && minAmount.value > 0 && amountSell.value < minAmount.value) {
    return t('order.minAmountError', {
      amount: formatAmount(minAmount.value),
      currency: currencySell.value,
    });
  }
  return '';
});

const currencyOptions = computed(() => {
  const sell = currencySell.value;
  if (sell === 'USDT') {
    return [{ label: 'THB', value: 'THB' }];
  }

  return [
    { label: 'THB', value: 'THB' },
    { label: 'USDT', value: 'USDT' },
  ];
});

watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) {
      return;
    }

    amountSell.value = uiStore.orderContext?.amountSell ?? exchangeStore.quote?.amountSell ?? 5000;
    currencyBuy.value = uiStore.orderContext?.currencyBuy ?? exchangeStore.quote?.currencyBuy ?? 'THB';
    methodGet.value = availableMethods.value[0] ?? 'cash';
    contactTelegram.value = authStore.user?.username ? `@${authStore.user.username}` : '';
  },
  { immediate: true },
);

async function submit() {
  if (!amountSell.value || amountSell.value <= 0) {
    Notify.create({ type: 'warning', message: t('exchange.quoteUnavailable') });
    return;
  }

  if (minAmount.value > 0 && amountSell.value < minAmount.value) {
    return;
  }

  try {
    const order = await exchangeStore.submitOrder({
      currencySell: currencySell.value,
      currencyBuy: currencyBuy.value,
      amountSell: amountSell.value,
      contactTelegram: contactTelegram.value || undefined,
      methodGet: methodGet.value,
    });

    ordersStore.prepend(order);
    Notify.create({ type: 'positive', message: t('order.success') });
    emit('update:modelValue', false);
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const data = (error as { response?: { data?: { code?: string; params?: Record<string, unknown> } } })?.response?.data;
    const code = data?.code;
    const params = data?.params ?? {};
    const messageKey =
      code === 'ORDER_ALREADY_EXISTS'
        ? 'errors.order_exists'
        : code === 'RATE_UNAVAILABLE'
          ? 'errors.rate_unavailable'
          : code === 'BANK_NOT_FOUND'
            ? 'errors.bank_missing'
            : code === 'UNSUPPORTED_PAIR'
              ? 'errors.unsupported_pair'
              : code === 'MIN_AMOUNT'
                ? 'errors.min_amount'
                : 'errors.generic';
    const message =
      code === 'MIN_AMOUNT'
        ? t(messageKey, { amount: formatAmount(params.minAmount as number), currency: params.currency })
        : t(messageKey);
    Notify.create({ type: 'negative', message });
  }
}
</script>
