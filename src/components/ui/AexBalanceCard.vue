<template>
  <AppSurface
    padded
    class="app-aex-balance-card"
    :class="{ 'app-aex-balance-card--clickable': clickable }"
    @click="handleClick"
  >
    <div class="row items-center no-wrap justify-between">
      <div class="app-aex-balance-card__label">{{ displayLabel }}</div>
      <div class="row items-center no-wrap">
        <div class="app-aex-balance-card__value">
          {{ formattedBalance }}
          <span class="app-aex-balance-card__currency">AEX</span>
        </div>
        <q-icon v-if="clickable" name="chevron_right" size="20px" class="app-aex-balance-card__chevron" />
      </div>
    </div>
  </AppSurface>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AppSurface from '@components/ui/AppSurface.vue';

const props = withDefaults(
  defineProps<{
    balance: number | null;
    label?: string;
    clickable?: boolean;
  }>(),
  {
    clickable: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();

const { t, locale } = useI18n();

const displayLabel = computed(() => props.label ?? t('profile.aexBalance'));

const formattedBalance = computed(() => {
  if (props.balance === null) return '0';
  if (Number.isInteger(props.balance)) {
    return props.balance.toLocaleString(locale.value);
  }
  return props.balance.toLocaleString(locale.value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

function handleClick() {
  if (props.clickable) {
    emit('click');
  }
}
</script>
