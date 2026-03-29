<template>
  <q-dialog :model-value="modelValue" position="bottom" class="app-dialog--bottom"
    @update:model-value="$emit('update:modelValue', $event)">
    <AppSurface class="app-sheet app-order-sheet">
      <div class="app-sheet-handle" />
      <div class="app-sheet__description">{{ t('order.description') }}</div>

      <div class="app-order-sheet__fields">
        <div class="app-order-sheet__field">
          <div class="app-order-sheet__label">{{ t('order.amount') }}</div>
          <div class="app-order-sheet__control">
            <q-input v-model.number="amountSell" class="app-order-sheet__input" type="number" borderless dense
              min="1" />
            <span class="app-order-sheet__suffix">{{ currencySell }}</span>
          </div>
        </div>

        <div class="app-order-sheet__field">
          <div class="app-order-sheet__label">{{ t('order.currency') }}</div>
          <div class="app-order-sheet__control app-order-sheet__control--select">
            <q-select v-model="currencyBuy" :options="currencyOptions" class="app-order-sheet__select" borderless dense
              emit-value map-options behavior="menu" />
          </div>
        </div>

        <div class="app-order-sheet__field">
          <div class="app-order-sheet__label">{{ t('order.contact') }}</div>
          <div class="app-order-sheet__control">
            <q-input v-model="contactTelegram" class="app-order-sheet__input" type="text" borderless dense
              :placeholder="t('order.contactPlaceholder')" />
          </div>
        </div>
      </div>

      <AppButton block :loading="exchangeStore.submitting" @click="submit">
        {{ t('common.submit') }}
      </AppButton>
    </AppSurface>
  </q-dialog>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppButton from '@components/ui/AppButton.vue';
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

const currencySell = computed(() => uiStore.orderContext?.currencySell ?? exchangeStore.quote?.currencySell ?? 'RUB');
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
      currencySell: currencySell.value,
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
