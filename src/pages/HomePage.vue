<template>
  <q-page class="app-page q-pt-md">
    <div class="app-page__content">
      <div class="app-grid-2">
        <q-btn
          v-for="action in homeStore.data?.quickActions ?? []"
          :key="action.id"
          flat
          no-caps
          class="app-surface q-pa-md column items-start"
          @click="handleAction(action)"
        >
          <q-icon :name="action.icon" color="primary" size="20px" class="q-mb-sm" />
          <div class="text-body1 text-weight-medium">{{ action.title }}</div>
          <div class="app-secondary-text text-caption">{{ action.subtitle }}</div>
        </q-btn>
      </div>

      <AppButton block @click="openOrderFromFeatured(homeStore.data?.rates.featured[0])">
        {{ t('common.exchange') }}
      </AppButton>

      <AppSurface padded>
        <div class="row items-center justify-between q-mb-sm">
          <AppSectionTitle>{{ t('exchange.title') }}</AppSectionTitle>
          <span class="app-muted text-caption">{{ formattedUpdatedAt }}</span>
        </div>

        <div class="column q-gutter-md">
          <div
            v-for="card in homeStore.data?.rates.featured ?? []"
            :key="card.id"
            class="app-surface q-pa-md"
          >
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-body1 text-weight-medium">{{ card.label }}</div>
              <div class="app-gold-text text-caption">{{ card.amountSellExample }} {{ card.fromCurrency }}</div>
            </div>
            <div class="app-rate-value app-gold-glow q-mb-xs">{{ card.rateText }}</div>
            <div class="app-secondary-text text-caption q-mb-md">
              {{ card.amountBuyExample }} {{ card.toCurrency }}
            </div>
            <AppButton block @click="openOrderFromFeatured(card)">{{ t('common.exchange') }}</AppButton>
          </div>
        </div>
      </AppSurface>

      <AppSurface deep padded>
        <div class="row items-center justify-between">
          <div class="row items-center q-gutter-md">
            <div
              class="row items-center justify-center"
              style="width: 52px; height: 52px; border-radius: 999px; background: var(--antex-gold-gradient); color: var(--antex-bg-primary);"
            >
              <q-icon name="workspace_premium" size="22px" />
            </div>
            <div class="text-body1 text-weight-medium">{{ homeStore.data?.banner.title ?? t('home.bonus') }}</div>
          </div>
          <AppButton variant="secondary" @click="uiStore.openMoreSheet()">
            {{ homeStore.data?.banner.actionLabel ?? t('common.details') }}
          </AppButton>
        </div>
      </AppSurface>

      <section>
        <AppSectionTitle class="q-mb-md">{{ t('home.services') }}</AppSectionTitle>
        <div class="app-grid-2">
          <AppSurface
            v-for="service in homeStore.data?.services ?? []"
            :key="service.id"
            padded
          >
            <q-icon :name="service.icon" color="primary" size="22px" class="q-mb-sm" />
            <div class="text-body1 text-weight-medium q-mb-xs">{{ service.title }}</div>
            <div class="app-secondary-text text-caption">{{ service.subtitle }}</div>
          </AppSurface>
        </div>
      </section>

      <section>
        <AppSectionTitle class="q-mb-md">{{ t('home.locations') }}</AppSectionTitle>
        <div class="app-grid-2">
          <div
            v-for="location in homeStore.data?.locations ?? []"
            :key="location.id"
            class="app-surface q-pa-md column justify-end"
            :style="locationStyle(location.accent)"
          >
            <div class="text-h6 text-weight-bold">{{ location.city }}</div>
            <div class="text-caption app-secondary-text">{{ location.hours }}</div>
          </div>
        </div>
      </section>

      <q-inner-loading :showing="homeStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppButton from '@components/ui/AppButton.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useHomeStore } from '@stores/home.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappQuickAction, MiniappRateCard } from '@types/miniapp';
import { formatMiniappDateTime } from '@utils/formatters';

const router = useRouter();
const homeStore = useHomeStore();
const uiStore = useUiStore();
const { locale, t } = useI18n();

onMounted(async () => {
  if (!homeStore.data) {
    await homeStore.load();
  }
});

const formattedUpdatedAt = computed(() => {
  const value = homeStore.data?.rates.updatedAt;
  if (!value) {
    return '';
  }

  return formatMiniappDateTime(value, locale.value);
});

/**
 * Обрабатывает быстрые действия главного экрана.
 */
function handleAction(action: MiniappQuickAction) {
  if (action.route) {
    router.push(action.route);
    return;
  }

  uiStore.openMoreSheet();
}

/**
 * Открывает форму заявки с контекстом выбранной карточки курса.
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
 * Возвращает декоративный градиент для карточки точки выдачи.
 */
function locationStyle(accent: string) {
  if (accent === 'ocean') {
    return {
      background:
        'linear-gradient(145deg, rgba(31,122,140,0.9), rgba(84,178,195,0.78), rgba(15,42,38,0.96))',
      minHeight: '172px',
    };
  }

  return {
    background:
      'linear-gradient(145deg, rgba(140,106,26,0.92), rgba(212,175,55,0.78), rgba(15,42,38,0.96))',
    minHeight: '172px',
  };
}
</script>
