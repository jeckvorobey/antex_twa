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
            <q-input
              :model-value="formattedAmountSell"
              class="app-order-sheet__input"
              type="text"
              inputmode="decimal"
              borderless
              dense
              @update:model-value="handleAmountSellInput"
            />
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
import { getMiniappErrorMessageKey } from '@utils/api-errors';
import { buildBuyCurrencyOptions, getDefaultReceiveMethod } from '@utils/exchange';
import { formatReadableNumber, parseReadableNumber } from '@utils/formatters';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { locale, t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const exchangeStore = useExchangeStore();
const ordersStore = useOrdersStore();
const uiStore = useUiStore();

const amountSell = ref<number | null>(null);
const currencyBuy = ref<string>('THB');
const contactTelegram = ref<string>('');
const formattedAmountSell = computed(() => formatReadableNumber(amountSell.value, locale.value));

const currencySell = computed(() => uiStore.orderContext?.currencySell ?? exchangeStore.quote?.currencySell ?? 'RUB');
const currencyOptions = computed(() => {
  const options = buildBuyCurrencyOptions(exchangeStore.screen?.pairs ?? [], currencySell.value);
  const contextBuyCurrency = uiStore.orderContext?.currencyBuy;
  if (options.length || !contextBuyCurrency) {
    return options;
  }

  return [{ label: contextBuyCurrency, value: contextBuyCurrency }];
});
const currentQuoteMethods = computed(() => {
  const contextMethods = uiStore.orderContext?.availableMethods;
  if (contextMethods?.length) {
    return contextMethods;
  }

  const quote = exchangeStore.quote;
  if (!quote || quote.currencySell !== currencySell.value || quote.currencyBuy !== currencyBuy.value) {
    return null;
  }

  return quote.availableMethods;
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

watch(currencyOptions, (options) => {
  if (!options.length || options.some((option) => option.value === currencyBuy.value)) {
    return;
  }

  currencyBuy.value = options[0]?.value ?? currencyBuy.value;
});

function handleAmountSellInput(value: string | number | null) {
  amountSell.value = parseReadableNumber(value);
}

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
      methodGet: getDefaultReceiveMethod(currencyBuy.value, currentQuoteMethods.value),
    });

    ordersStore.prepend(order);
    Notify.create({ type: 'positive', message: t('order.success') });
    emit('update:modelValue', false);
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    Notify.create({ type: 'negative', message: t(getMiniappErrorMessageKey(code)) });
  }
}
</script>
