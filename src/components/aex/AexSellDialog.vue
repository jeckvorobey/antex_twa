<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <AppSurface padded class="q-dialog-plugin" style="min-width: 320px; max-width: 400px">
      <div class="text-weight-bold text-subtitle1 q-mb-md">
        {{ t('referral.sellTitle') }}
      </div>

      <!-- Order selector -->
      <div class="q-mb-md">
        <div class="text-caption text-grey-6 q-mb-xs">{{ t('referral.sellSelectOrder') }}</div>
        <q-select
          v-model="selectedOrder"
          :options="orderOptions"
          option-value="id"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          bottom-slots
          :loading="ordersLoading"
          :placeholder="t('referral.sellSelectOrderPlaceholder')"
          bg-color="transparent"
          :error="!!errors.order"
          :error-message="errors.order"
          @blur="validateOrder"
        />
      </div>

      <!-- Amount input -->
      <div class="q-mb-md">
        <div class="text-caption text-grey-6 q-mb-xs">
          {{ t('referral.sellAmount') }}
          <span v-if="availableBalance > 0" class="text-warning">
            ({{ t('referral.sellAvailable', { amount: formatAmount(availableBalance) }) }})
          </span>
        </div>
        <q-input
          v-model.number="amount"
          type="number"
          outlined
          dense
          bottom-slots
          :min="0.01"
          :max="availableBalance"
          step="0.01"
          bg-color="transparent"
          :error="!!errors.amount"
          :error-message="errors.amount"
          @blur="validateAmount"
        />
      </div>

      <!-- Actions -->
      <div class="row q-gutter-sm justify-end">
        <AppButton variant="secondary" @click="$emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </AppButton>
        <AppButton
          color="warning"
          :loading="aexStore.sellLoading"
          :disabled="!isValid"
          @click="handleSell"
        >
          {{ t('referral.sellConfirm') }}
        </AppButton>
      </div>
    </AppSurface>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import AppButton from '@components/ui/AppButton.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { fetchOrders } from '@services/api/miniapp.service';
import { useAexStore } from '@stores/aex.store';
import type { MiniappOrderItem } from '@types/miniapp';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  sold: [];
}>();

const { t, locale } = useI18n();
const aexStore = useAexStore();

const selectedOrder = ref<number | null>(null);
const amount = ref<number | null>(null);
const orders = ref<MiniappOrderItem[]>([]);
const ordersLoading = ref(false);

/** Тouched state per field — prevents showing errors before user interaction. */
const touched = reactive({ order: false, amount: false });

/** Error messages per field. Null = no error. */
const errors = reactive<{ order: string | null; amount: string | null }>({
  order: null,
  amount: null,
});

const availableBalance = computed(() => aexStore.balance?.available ?? 0);

const orderOptions = computed(() =>
  orders.value.map((order) => ({
    id: order.id,
    label: `#${order.publicNumber} — ${order.amountSell} ${order.currencySell}`,
  })),
);

const isValid = computed(
  () =>
    selectedOrder.value !== null &&
    amount.value !== null &&
    amount.value > 0 &&
    amount.value <= availableBalance.value,
);

onMounted(async () => {
  ordersLoading.value = true;
  try {
    const response = await fetchOrders({ limit: 50, offset: 0 });
    orders.value = response.items;
  } finally {
    ordersLoading.value = false;
  }
});

/* ---- Validation helpers ---- */

function validateOrder() {
  touched.order = true;
  errors.order = selectedOrder.value === null ? t('referral.sellOrderRequired') : null;
}

function validateAmount() {
  touched.amount = true;
  if (amount.value === null || amount.value <= 0) {
    errors.amount = t('referral.sellAmountPositive');
  } else if (amount.value > availableBalance.value) {
    errors.amount = t('referral.sellAmountExceeds');
  } else {
    errors.amount = null;
  }
}

/** Validate all fields before submit. Returns true if form is valid. */
function validateAll(): boolean {
  validateOrder();
  validateAmount();
  return !errors.order && !errors.amount;
}

/* ---- Submit ---- */

async function handleSell() {
  if (!validateAll()) {
    return;
  }
  if (!selectedOrder.value || !amount.value || !isValid.value) {
    return;
  }

  const result = await aexStore.sellAex(selectedOrder.value, amount.value);
  if (result.success) {
    emit('update:modelValue', false);
    emit('sold');
  }
}

function formatAmount(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString(locale.value);
  }
  return value.toLocaleString(locale.value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
</script>
