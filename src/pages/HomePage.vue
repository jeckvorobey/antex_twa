<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--home">
      <AppHeaderBar />

      <section class="app-home-overview">
        <div class="app-home-quick-grid">
          <button
            v-for="action in quickActions"
            :key="action.id"
            type="button"
            class="app-home-quick-card"
            @click="handleAction(action)"
          >
            <span class="app-home-quick-card__icon">
              <q-icon :name="action.icon" size="18px" />
            </span>
            <span class="app-home-quick-card__title">{{ action.title }}</span>
          </button>
        </div>

        <div class="app-home-stats-grid">
          <AppSurface
            v-for="stat in statCards"
            :key="stat.id"
            class="app-home-stat-card"
          >
            <div class="app-home-stat-card__label">{{ stat.label }}</div>
            <div class="app-home-stat-card__value">{{ stat.value }}</div>
          </AppSurface>
        </div>
      </section>

      <AppButton block class="app-home-primary-button" @click="openOrderFromFeatured(featuredRates[0])">
        {{ t('common.exchange') }}
      </AppButton>

      <AppSurface class="app-home-rates-card">
        <div class="app-home-country-chips">
          <q-chip
            v-for="chip in homeStore.data?.rates.chips ?? []"
            :key="chip"
            clickable
            :class="['app-chip', selectedRateChip === chip ? 'app-chip--active' : null]"
            @click="selectedRateChip = chip"
          >
            {{ chip }}
          </q-chip>
        </div>

        <button
          v-for="card in featuredRates"
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
            <AppRateValue :value="formatRateValue(card.rate)" shimmer />
            <q-icon name="arrow_forward" size="14px" />
          </div>

          <div class="app-home-rate-item__side app-home-rate-item__side--right">
            <div class="app-home-rate-item__currency">{{ getRateSide(card, 'to').title }}</div>
            <div class="app-home-rate-item__meta">{{ getRateSide(card, 'to').meta }}</div>
          </div>
        </button>

        <AppButton variant="secondary" block class="app-home-rates-card__footer" @click="goExchange">
          Развернуть
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

        <div class="app-home-location-grid">
          <AppSurface
            v-for="location in homeStore.data?.locations ?? []"
            :key="location.id"
            class="app-home-location-card"
            :style="locationStyle(location.accent)"
          >
            <div class="app-home-location-card__title">{{ location.city }}</div>
            <div class="app-home-location-card__hours">{{ location.hours }}</div>
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
import { useRouter } from 'vue-router';

import AppButton from '@components/ui/AppButton.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import AppRateValue from '@components/ui/AppRateValue.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useHomeStore } from '@stores/home.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappQuickAction, MiniappRateCard } from '@types/miniapp';

const router = useRouter();
const homeStore = useHomeStore();
const uiStore = useUiStore();
const { t } = useI18n();

const selectedRateChip = ref('');
const statCards = [
  { id: 'partnership', label: 'Партнёрство', value: 'Приводите клиентов' },
  { id: 'deposit', label: 'Ваш депозит', value: '0' },
];
const locationChips = ['Phuket', 'Pattaya', 'Bangkok', 'Huahin', 'Samui'];

const quickActions = computed(() => (homeStore.data?.quickActions ?? []).slice(0, 4));
const featuredRates = computed(() => homeStore.data?.rates.featured ?? []);

onMounted(async () => {
  if (!homeStore.data) {
    await homeStore.load();
  }

  if (!selectedRateChip.value) {
    selectedRateChip.value = homeStore.data?.rates.chips[0] ?? '';
  }
});

/**
 * Открывает вторичный сценарий из плитки главного экрана.
 */
function handleAction(action: MiniappQuickAction) {
  if (action.route) {
    void router.push(action.route);
    return;
  }

  uiStore.openMoreSheet();
}

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
 * Переводит пользователя на полный экран обмена.
 */
function goExchange() {
  void router.push({ name: 'exchange' });
}

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

function formatRateValue(rate: number) {
  return rate >= 1 ? rate.toFixed(3) : rate.toFixed(4);
}

/**
 * Возвращает декоративный градиент для карточки точки выдачи.
 */
function locationStyle(accent: string) {
  if (accent === 'ocean') {
    return {
      background:
        'linear-gradient(145deg, rgba(31,122,140,0.95), rgba(84,178,195,0.82), rgba(15,42,38,0.98))',
    };
  }

  return {
    background:
      'linear-gradient(145deg, rgba(140,106,26,0.95), rgba(212,175,55,0.82), rgba(15,42,38,0.98))',
  };
}
</script>
