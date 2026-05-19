<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--home">
      <section class="app-section app-section--home">
        <AppSectionTitle>{{ t('home.locations') }}</AppSectionTitle>

        <div class="app-home-country-chips">
          <q-chip
            v-for="country in homeStore.data?.countries ?? []"
            :key="country.id"
            clickable
            :class="['app-chip', selectedCountry === country.id ? 'app-chip--active' : null]"
            @click="selectCountry(country.id)"
          >
            {{ country.label }}
          </q-chip>
        </div>

        <div class="app-home-location-chips">
          <q-chip
            v-for="location in visibleLocations"
            :key="location.id"
            clickable
            :class="['app-chip', selectedCityId === location.id ? 'app-chip--active' : null]"
            @click="selectCity(location.id)"
          >
            {{ location.city }}
          </q-chip>
        </div>
      </section>

      <AppSurface class="app-home-rates-card">
        <div class="app-home-country-chips app-home-rates-card__chips">
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
          v-for="{ card, presentation } in visibleRateCards"
          :key="card.id"
          type="button"
          class="app-home-rate-item"
          @click="openOrderFromFeatured(card)"
        >
          <div class="app-home-rate-item__side">
            <div class="app-home-rate-item__currency">
              <AppCurrencyMark class="app-home-rate-item__flag" :mark="presentation.left.flag" />
              <span>{{ presentation.left.title }}</span>
            </div>
            <div class="app-home-rate-item__meta">{{ presentation.left.meta }}</div>
          </div>

          <div class="app-home-rate-item__pill">
            <span class="app-home-rate-item__rate-prefix">{{ t('home.ratePrefix') }}</span>
            <AppRateValue :value="card.rateDisplay" />
            <q-icon name="arrow_forward" size="14px" />
          </div>

          <div class="app-home-rate-item__side app-home-rate-item__side--right">
            <div class="app-home-rate-item__currency app-home-rate-item__currency--right">
              <span>{{ presentation.right.title }}</span>
              <AppCurrencyMark class="app-home-rate-item__flag" :mark="presentation.right.flag" />
            </div>
            <div class="app-home-rate-item__meta">{{ presentation.right.meta }}</div>
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

      <AppButton block class="app-home-primary-button" @click="openDefaultExchangeOrder">
        {{ t('common.exchange') }}
      </AppButton>

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
import AppCurrencyMark from '@components/ui/AppCurrencyMark.vue';
import AppRateValue from '@components/ui/AppRateValue.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useHomeStore } from '@stores/home.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappRateCard } from '@types/miniapp';
import {
  buildHomeAvailableMethods,
  buildHomeRateCardPresentation,
  buildHomeRateFilterChips,
  buildHomeRateView,
  buildHomeVisibleLocations,
  HOME_ALL_FILTER_KEY,
  resetHomeRateExpansion,
  resolveHomeCountryByCity,
} from '@utils/home-rates';

const homeStore = useHomeStore();
const uiStore = useUiStore();
const { t } = useI18n();

const selectedRateChip = ref(HOME_ALL_FILTER_KEY);
const selectedCountry = ref<string | null>(null);
const selectedCityId = ref<string | null>(null);
const ratesExpanded = ref(false);
const featuredRates = computed(() => homeStore.data?.rates.featured ?? []);
const previewLimit = computed(() => homeStore.data?.rates.previewLimit ?? 3);
const locations = computed(() => homeStore.data?.locations ?? []);
const visibleLocations = computed(() => buildHomeVisibleLocations(
  locations.value,
  selectedCountry.value,
));
const filterChips = computed(() => buildHomeRateFilterChips({
  backendChips: homeStore.data?.rates.chips ?? [],
  allLabel: t('home.all'),
  rates: featuredRates.value,
  selectedCountry: selectedCountry.value,
}));
const rateView = computed(() => buildHomeRateView({
  rates: featuredRates.value,
  filterKey: selectedRateChip.value,
  previewLimit: previewLimit.value,
  expanded: ratesExpanded.value,
  selectedCountry: selectedCountry.value,
}));
const visibleRates = computed(() => rateView.value.visibleRates);
const visibleRateCards = computed(() => visibleRates.value.map((card) => ({
  card,
  presentation: buildHomeRateCardPresentation({
    card,
    selectedCityId: selectedCityId.value,
  }),
})));
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
  selectedCountry.value = null;
  selectedCityId.value = null;
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
    availableMethods: buildHomeAvailableMethods(selectedCityId.value),
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
  if (chipKey === HOME_ALL_FILTER_KEY) {
    selectedCountry.value = null;
    selectedCityId.value = null;
  }

  selectedRateChip.value = chipKey;
  ratesExpanded.value = resetHomeRateExpansion(ratesExpanded.value);
}

function selectCountry(countryId: string) {
  selectedCountry.value = countryId;
  selectedCityId.value = null;
  selectedRateChip.value = HOME_ALL_FILTER_KEY;
  ratesExpanded.value = resetHomeRateExpansion(ratesExpanded.value);
}

function selectCity(cityId: string) {
  const countryId = resolveHomeCountryByCity(locations.value, cityId);
  if (!countryId) {
    return;
  }

  selectedCountry.value = countryId;
  selectedCityId.value = cityId;
  selectedRateChip.value = HOME_ALL_FILTER_KEY;
  ratesExpanded.value = resetHomeRateExpansion(ratesExpanded.value);
}

/**
 * Раскрывает все пары текущего фильтра прямо в home-блоке.
 */
function expandRates() {
  ratesExpanded.value = true;
}
</script>
