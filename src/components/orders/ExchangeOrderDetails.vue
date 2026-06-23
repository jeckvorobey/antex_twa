<template>
  <div class="column q-gutter-y-md">
    <AppSurface class="app-exchange-calculator">
      <div class="column q-gutter-sm">
        <div>
          <div class="app-exchange-calculator__label">{{ t('exchange.payAmount') }}</div>
          <div class="app-exchange-calculator__control">
            <q-select
              v-model="selectedSellCurrencyModel"
              :options="sellOptions"
              class="app-exchange-calculator__currency"
              borderless
              dense
              emit-value
              map-options
              behavior="menu"
            />
            <q-input
              ref="amountSellInputRef"
              :model-value="formattedAmountSell"
              class="app-exchange-calculator__amount"
              type="text"
              borderless
              dense
              inputmode="decimal"
              input-class="text-right"
              :rules="amountSellRules"
              reactive-rules
              @update:model-value="handleAmountSellInput"
              @blur="handleAmountSellBlur"
            />
          </div>
          <div v-if="amountSellError" class="app-exchange-calculator__error">
            <q-icon name="warning" size="xs" class="q-mr-xs" />
            {{ amountSellError }}
          </div>
        </div>

        <div class="app-exchange-calculator__field">
          <div class="app-exchange-calculator__label">{{ t('exchange.receiveCurrency') }}</div>
          <div class="app-exchange-calculator__control">
            <q-select
              v-model="selectedBuyCurrencyModel"
              :options="buyOptions"
              class="app-exchange-calculator__currency"
              borderless
              dense
              emit-value
              map-options
              behavior="menu"
            />
            <q-input
              :model-value="formattedAmountBuy"
              class="app-exchange-calculator__amount"
              type="text"
              borderless
              dense
              readonly
              inputmode="decimal"
              input-class="text-right text-antex-gold"
            />
          </div>
        </div>
      </div>

      <div class="app-exchange-calculator__rate">
        {{ rateLabel }}
      </div>

      <div v-if="minAmount > 0" class="app-exchange-calculator__hint">
        {{
          t('order.minAmountHint', {
            amount: formatReadableNumber(minAmount, locale),
            currency: selectedSellCurrency,
          })
        }}
      </div>
    </AppSurface>

    <div v-if="countryOptions.length" class="app-chip-row app-chip-row--exchange">
      <AppFlagOptionButton
        v-for="country in countryOptions"
        :key="country.value"
        :label="country.label"
        :mark="country.mark ?? ''"
        :active="selectedCountryModel === country.value"
        @click="selectedCountryModel = country.value"
      />
    </div>

    <AppSurface class="q-pa-md">
      <div class="app-order-sheet__fields">
        <div class="app-order-sheet__field">
          <div class="app-order-sheet__label">{{ receiveLocationTitle }}</div>
          <div v-if="receiveLocationLabel" class="row q-col-gutter-sm">
            <div class="col-12">
              <div class="app-order-sheet__control">
                <span class="text-body2">{{ receiveLocationLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="app-order-sheet__field">
          <div class="app-order-sheet__label">{{ t('exchange.receiveMethod') }}</div>
          <q-option-group
            v-model="selectedMethodModel"
            class="app-order-sheet__methods q-mt-xs"
            :options="methodOptions"
            color="warning"
          />
        </div>

        <div v-if="selectedMethodModel === 'cash'" class="app-order-sheet__field">
          <div class="app-order-sheet__label">{{ t('exchange.cashCities') }}</div>
          <div class="app-home-location-chips">
            <AppFlagOptionButton
              v-for="city in cityOptions"
              :key="city.value"
              :label="city.label"
              :mark="city.mark"
              :active="selectedCityIdModel === city.value"
              @click="selectedCityIdModel = city.value"
            />
          </div>
        </div>
      </div>
    </AppSurface>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import AppFlagOptionButton from '@components/ui/AppFlagOptionButton.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { getMinAmount } from '@constants/limits';
import type { MiniappReceiveMethod } from '@types/miniapp';
import { formatReadableNumber, parseReadableNumber } from '@utils/formatters';
import {
  buildReceiveLocationLabel,
  getReceiveLocationTitleKey,
  normalizeReceiveMethods,
  type ExchangeCityOption,
  type ExchangeOption,
} from '@utils/exchange';

const props = defineProps<{
  sellOptions: ExchangeOption[];
  buyOptions: ExchangeOption[];
  selectedSellCurrency: string;
  selectedBuyCurrency: string;
  amountSell: number | null;
  amountBuy: number | null;
  rateLabel: string;
  countryOptions: ExchangeOption[];
  cityOptions: ExchangeCityOption[];
  selectedCountry: string | null;
  selectedMethod: MiniappReceiveMethod;
  selectedCityId: number | null;
  availableMethods?: string[] | null;
}>();

const emit = defineEmits<{
  'update:selectedSellCurrency': [value: string];
  'update:selectedBuyCurrency': [value: string];
  'update:amountSell': [value: number | null];
  'update:selectedCountry': [value: string | null];
  'update:selectedMethod': [value: MiniappReceiveMethod];
  'update:selectedCityId': [value: number | null];
}>();

const { locale, t } = useI18n();
const amountSellInputRef = ref<{ focus: () => void } | null>(null);

/** Текущее сообщение ошибки валидации суммы (отображается под инпутом). */
const amountSellError = ref('');

const selectedSellCurrencyModel = computed({
  get: () => props.selectedSellCurrency,
  set: (value: string) => emit('update:selectedSellCurrency', value),
});

const selectedBuyCurrencyModel = computed({
  get: () => props.selectedBuyCurrency,
  set: (value: string) => emit('update:selectedBuyCurrency', value),
});

const selectedCountryModel = computed({
  get: () => props.selectedCountry,
  set: (value: string | null) => emit('update:selectedCountry', value),
});

const selectedMethodModel = computed({
  get: () => props.selectedMethod,
  set: (value: MiniappReceiveMethod) => emit('update:selectedMethod', value),
});

const selectedCityIdModel = computed({
  get: () => props.selectedCityId,
  set: (value: number | null) => emit('update:selectedCityId', value),
});

const selectedCountryLabel = computed(
  () =>
    props.countryOptions.find((country) => country.value === props.selectedCountry)?.label ?? null,
);

const selectedCityLabel = computed(
  () => props.cityOptions.find((city) => city.value === props.selectedCityId)?.label ?? null,
);

const receiveLocationTitle = computed(() => t(getReceiveLocationTitleKey(props.selectedMethod)));

const receiveLocationLabel = computed(() =>
  buildReceiveLocationLabel({
    method: props.selectedMethod,
    countryLabel: selectedCountryLabel.value,
    cityLabel: selectedCityLabel.value,
  }),
);

const methodOptions = computed(() => {
  const labels: Record<MiniappReceiveMethod, string> = {
    qrcode: t('exchange.qrcode'),
    cash: t('exchange.cash'),
    bank_account: t('exchange.bankAccount'),
    pay_services: t('exchange.payServices'),
  };
  return normalizeReceiveMethods(props.availableMethods).map((method) => ({
    label: labels[method],
    value: method,
  }));
});

const formattedAmountSell = computed(() => formatReadableNumber(props.amountSell, locale.value));
const formattedAmountBuy = computed(() => formatReadableNumber(props.amountBuy, locale.value));

/** Минимальная сумма для текущего метода и валюты. */
const minAmount = computed(() => getMinAmount(props.selectedMethod, props.selectedSellCurrency));

/** Правила валидации для поля суммы отправки. */
const amountSellRules = computed(() => [
  (val: string | number | null) => {
    if (!val) {
      return true;
    }
    const amount = parseReadableNumber(val);
    if (amount <= 0) {
      return true;
    }
    if (minAmount.value > 0 && amount < minAmount.value) {
      return t('errors.exchange_min_amount', {
        amount: formatReadableNumber(minAmount.value, locale.value),
        currency: props.selectedSellCurrency,
      });
    }
    return true;
  },
]);

/** Автоподстановка минимальной суммы при смене метода получения. */
watch(
  () => props.selectedMethod,
  (method) => {
    const min = getMinAmount(method, props.selectedSellCurrency);
    if (min > 0 && (!props.amountSell || props.amountSell < min)) {
      emit('update:amountSell', min);
    }
  },
  { immediate: true },
);

/** Автоподстановка минимальной суммы при смене валюты отправки. */
watch(
  () => props.selectedSellCurrency,
  (currency) => {
    const min = getMinAmount(props.selectedMethod, currency);
    if (min > 0 && (!props.amountSell || props.amountSell < min)) {
      emit('update:amountSell', min);
    }
  },
  { immediate: true },
);

function handleAmountSellInput(value: string | number | null) {
  emit('update:amountSell', parseReadableNumber(value));
}

/** Автоподстановка минимальной суммы при уходе с поля ввода. */
function handleAmountSellBlur() {
  if (props.amountSell !== null && minAmount.value > 0 && props.amountSell < minAmount.value) {
    emit('update:amountSell', minAmount.value);
  }
}

/** Валидация суммы и обновление сообщения об ошибке. */
function validateAmountSell() {
  const val = props.amountSell;
  if (!val || val <= 0) {
    amountSellError.value = '';
    return;
  }
  if (minAmount.value > 0 && val < minAmount.value) {
    amountSellError.value = t('errors.exchange_min_amount', {
      amount: formatReadableNumber(minAmount.value, locale.value),
      currency: props.selectedSellCurrency,
    });
    return;
  }
  amountSellError.value = '';
}

watch(
  [() => props.amountSell, minAmount, () => props.selectedSellCurrency],
  () => validateAmountSell(),
  { immediate: true },
);

function focusAmountSell() {
  amountSellInputRef.value?.focus();
}

defineExpose({ focusAmountSell });
</script>
