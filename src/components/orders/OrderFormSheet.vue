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
        />

        <AppInputField
          v-model="currencyBuy"
          :label="t('order.currency')"
          :options="currencyOptions"
          type="select"
        />

        <AppInputField
          v-model="contactTelegram"
          :label="t('order.contact')"
          type="text"
          :placeholder="t('order.contactPlaceholder')"
        />

        <AppButton block :loading="exchangeStore.submitting" @click="submit">
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
import { useAuthStore } from '@stores/auth.store';
import { useExchangeStore } from '@stores/exchange.store';
import { useOrdersStore } from '@stores/orders.store';
import { useUiStore } from '@stores/ui.store';

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
const contactTelegram = ref<string>('');

const currencyOptions = computed(() => {
  const sell = uiStore.orderContext?.currencySell ?? 'RUB';
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
    contactTelegram.value = authStore.user?.username ? `@${authStore.user.username}` : '';
  },
  { immediate: true },
);

/**
 * Отправляет miniapp-заявку и показывает локализованное сообщение по коду ошибки.
 */
async function submit() {
  if (!amountSell.value || amountSell.value <= 0) {
    Notify.create({ type: 'warning', message: t('exchange.quoteUnavailable') });
    return;
  }

  try {
    const order = await exchangeStore.submitOrder({
      currencySell: uiStore.orderContext?.currencySell ?? exchangeStore.quote?.currencySell ?? 'RUB',
      currencyBuy: currencyBuy.value,
      amountSell: amountSell.value,
      contactTelegram: contactTelegram.value || undefined,
      methodGet: 'cash',
    });

    ordersStore.prepend(order);
    Notify.create({ type: 'positive', message: t('order.success') });
    emit('update:modelValue', false);
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    const messageKey =
      code === 'ORDER_ALREADY_EXISTS'
        ? 'errors.order_exists'
        : code === 'RATE_UNAVAILABLE'
          ? 'errors.rate_unavailable'
          : code === 'BANK_NOT_FOUND'
            ? 'errors.bank_missing'
            : code === 'UNSUPPORTED_PAIR'
              ? 'errors.unsupported_pair'
              : 'errors.generic';
    Notify.create({ type: 'negative', message: t(messageKey) });
  }
}
</script>
