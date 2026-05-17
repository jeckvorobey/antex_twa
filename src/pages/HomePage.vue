<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--home">
      <section class="app-section app-section--home">
        <AppSectionTitle>{{ t('home.locations') }}</AppSectionTitle>

        <div class="app-home-location-chips">
          <span
            v-for="city in locationChips"
            :key="city"
            class="app-home-location-chip"
          >
            {{ city }}
          </span>
        </div>
      </section>

      <AppButton block class="app-home-primary-button" @click="openDefaultExchangeOrder">
        {{ t('common.exchange') }}
      </AppButton>

      <AppSurface class="app-home-rates-card">
        <div class="app-home-country-chips">
          <q-chip
            v-for="chip in filterChips"
            :key="chip.key"
            clickable
            :class="['app-chip', selectedRateChip === chip.key ? 'app-chip--active' : null]"
            @click="selectRateChip(chip.key)"
          >
            {{ chip.label }}
          </q-chip>
        </div>

        <button
          v-for="card in visibleRates"
          :key="card.id"
          type="button"
          class="app-home-rate-item"
          @click="openOrderFromFeatured(card)"
        >
          <div class="app-home-rate-item__side">
            <div class="app-home-rate-item__currency">{{ getRateSide(card, 'from').title }}</div>
            <div class="app-home-rate-item__meta">{{ getRateSide(card, 'from').meta }}</div>
          </div>

          <div class="app-home-rate-item__pill">
            <AppRateValue :value="formatRateValue(card.rate)" />
            <q-icon name="arrow_forward" size="14px" />
          </div>

          <div class="app-home-rate-item__side app-home-rate-item__side--right">
            <div class="app-home-rate-item__currency">{{ getRateSide(card, 'to').title }}</div>
            <div class="app-home-rate-item__meta">{{ getRateSide(card, 'to').meta }}</div>
          </div>
        </button>

        <AppButton
          v-if="canExpand"
          variant="secondary"
          block
          class="app-home-rates-card__footer"
          @click="expandRates"
        >
          {{ t('home.expandRates') }}
        </AppButton>
      </AppSurface>

      <AppSurface class="app-home-bonus-card">
        <div class="app-home-bonus-card__coin">
          <q-icon name="workspace_premium" size="22px" />
        </div>
        <div class="app-home-bonus-card__copy">
          {{ homeStore.data?.banner.title ?? t('home.bonus') }}
        </div>
        <AppButton variant="secondary" class="app-home-bonus-card__button" @click="uiStore.openMoreSheet()">
          {{ homeStore.data?.banner.actionLabel ?? t('home.bonusAction') }}
        </AppButton>
      </AppSurface>

      <section class="app-section app-section--home">
        <AppSectionTitle>{{ t('home.services') }}</AppSectionTitle>

        <div class="app-home-services-grid">
          <AppSurface
            v-for="service in homeStore.data?.services ?? []"
            :key="service.id"
            class="app-home-service-card"
          >
            <div class="app-home-service-card__icon">
              <q-icon :name="service.icon" size="18px" />
            </div>
            <div class="app-home-service-card__title">{{ service.title }}</div>
            <div class="app-home-service-card__subtitle">{{ service.subtitle }}</div>
          </AppSurface>
        </div>
      </section>

      <q-inner-loading :showing="homeStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import AppButton from '@components/ui/AppButton.vue';
import AppRateValue from '@components/ui/AppRateValue.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useHomeStore } from '@stores/home.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappRateCard } from '@types/miniapp';
import {
  buildHomeRateFilterChips,
  buildHomeRateView,
  HOME_ALL_FILTER_KEY,
  resetHomeRateExpansion,
} from '@utils/home-rates';

const homeStore = useHomeStore();
const uiStore = useUiStore();
const { t } = useI18n();

const selectedRateChip = ref(HOME_ALL_FILTER_KEY);
const ratesExpanded = ref(false);
const locationChips = ['Тайланд', 'Вьетнам', 'Грузия'];
const featuredRates = computed(() => homeStore.data?.rates.featured ?? []);
const previewLimit = computed(() => homeStore.data?.rates.previewLimit ?? 3);
const filterChips = computed(() => buildHomeRateFilterChips(
  homeStore.data?.rates.chips ?? [],
  t('home.all'),
));
const rateView = computed(() => buildHomeRateView({
  rates: featuredRates.value,
  filterKey: selectedRateChip.value,
  previewLimit: previewLimit.value,
  expanded: ratesExpanded.value,
}));
const visibleRates = computed(() => rateView.value.visibleRates);
const canExpand = computed(() => rateView.value.canExpand);
const defaultExchangeCard = computed(() => (
  featuredRates.value.find((card) => card.id === 'rub-thb')
  ?? featuredRates.value[0]
));

onMounted(async () => {
  if (!homeStore.data) {
    await homeStore.load();
  }

  selectedRateChip.value = HOME_ALL_FILTER_KEY;
  ratesExpanded.value = resetHomeRateExpansion(ratesExpanded.value);
});

/**
 * Открывает sheet заявки с предзаполнением по выбранной паре.
 */
function openOrderFromFeatured(card?: MiniappRateCard) {
  if (!card) {
    uiStore.openOrderSheet();
    return;
  }

  uiStore.openOrderSheet({
    currencySell: card.fromCurrency,
    currencyBuy: card.toCurrency,
    amountSell: card.amountSellExample,
    amountBuy: card.amountBuyExample,
    rate: card.rate,
  });
}

/**
 * Сохраняет текущий дефолтный intent главной для открытия заявки RUB/THB.
 */
function openDefaultExchangeOrder() {
  openOrderFromFeatured(defaultExchangeCard.value);
}

/**
 * Меняет фильтр и заново сворачивает список текущего набора пар.
 */
function selectRateChip(chipKey: string) {
  selectedRateChip.value = chipKey;
  ratesExpanded.value = resetHomeRateExpansion(ratesExpanded.value);
}

/**
 * Раскрывает все пары текущего фильтра прямо в home-блоке.
 */
function expandRates() {
  ratesExpanded.value = true;
}

/**
 * Возвращает подпись и мета-текст для одной стороны карточки курса.
 */
function getRateSide(card: MiniappRateCard, side: 'from' | 'to') {
  const metaMap: Record<string, { from: string; to: string }> = {
    'rub-thb': { from: 'по СБП', to: 'наличными' },
    'rub-usdt': { from: 'по СБП', to: 'на кошелёк' },
    'usdt-thb': { from: 'наличными', to: 'на карту' },
  };
  const meta = metaMap[card.id] ?? { from: 'по курсу', to: 'по курсу' };

  if (side === 'from') {
    return { title: card.fromCurrency, meta: meta.from };
  }

  return { title: card.toCurrency, meta: meta.to };
}

/**
 * Форматирует числовое значение курса для compact UI-пилюли.
 */
function formatRateValue(rate: number) {
  return rate >= 1 ? rate.toFixed(3) : rate.toFixed(4);
}

</script>
