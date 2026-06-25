<template>
  <AppSurface class="app-aex-balance-card" :class="{ 'app-aex-balance-card--clickable': clickable }" @click="handleClick">
    <div class="row items-center no-wrap">
      <div class="col">
        <div class="app-aex-balance-card__label">{{ t('profile.aexBalance') }}</div>
        <div class="app-aex-balance-card__value">
          {{ formattedBalance }}
          <span class="app-aex-balance-card__currency">AEX</span>
        </div>
      </div>
      <q-icon v-if="clickable" name="chevron_right" size="20px" class="app-aex-balance-card__chevron" />
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
