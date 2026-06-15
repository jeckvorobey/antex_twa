<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--home">
      <section class="app-section app-section--home">
        <AppSectionTitle>{{ t('home.locations') }}</AppSectionTitle>

        <div class="app-home-country-chips">
          <AppFlagOptionButton
            v-for="country in homeStore.data?.countries ?? []"
            :key="country.id"
            :label="country.label"
            :mark="country.flag"
            :active="selectedCountry === country.id"
            @click="selectCountry(country.id)"
          />
        </div>

        <div class="app-home-location-chips">
          <AppFlagOptionButton
            v-for="location in visibleLocations"
            :key="location.id"
            :label="location.city"
            :mark="location.countryFlag"
            :active="selectedCityId === location.id"
            @click="selectCity(location.id)"
          />
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
          @click="toggleRatesExpansion"
        >
          {{ ratesExpanded ? t('home.collapseRates') : t('home.expandRates') }}
        </AppButton>
      </AppSurface>

      <AppButton block class="app-home-primary-button" @click="openDefaultExchangeOrder">
        {{ t('common.exchange') }}
      </AppButton>

      <section class="app-section app-section--home">
        <AppSectionTitle>{{ t('home.social.title') }}</AppSectionTitle>

        <div class="app-home-social-grid">
          <AppSurface
            v-for="link in socialLinks"
            :key="link.id"
            class="app-home-social-card"
          >
            <a
              class="app-home-social-card__link"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="app-home-social-card__icon">
                <q-icon v-if="link.icon" :name="link.icon" size="18px" />
                <span v-else class="app-home-social-card__max-mark" aria-hidden="true">
                  {{ link.maxMark }}
                </span>
              </span>
              <span class="app-home-social-card__copy">
                <span class="app-home-social-card__title">{{ t(link.titleKey) }}</span>
                <span class="app-home-social-card__subtitle">{{ t(link.subtitleKey) }}</span>
              </span>
            </a>
          </AppSurface>
        </div>
      </section>

      <AppSurface v-if="showReferralBanner" class="app-home-bonus-card">
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
            <a
              v-if="managerTelegramHref"
              class="app-home-service-card__link"
              :href="managerTelegramHref"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="app-home-service-card__icon">
                <q-icon :name="service.icon" size="18px" />
              </div>
              <div class="app-home-service-card__title">{{ service.title }}</div>
              <div class="app-home-service-card__subtitle">{{ service.subtitle }}</div>
            </a>
            <div v-else class="app-home-service-card__link app-home-service-card__link--disabled">
              <div class="app-home-service-card__icon">
                <q-icon :name="service.icon" size="18px" />
              </div>
              <div class="app-home-service-card__title">{{ service.title }}</div>
              <div class="app-home-service-card__subtitle">{{ service.subtitle }}</div>
            </div>
          </AppSurface>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import AppButton from '@components/ui/AppButton.vue';
import AppCurrencyMark from '@components/ui/AppCurrencyMark.vue';
import AppFlagOptionButton from '@components/ui/AppFlagOptionButton.vue';
import AppRateValue from '@components/ui/AppRateValue.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useHomeStore } from '@stores/home.store';
import { useProfileStore } from '@stores/profile.store';
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
const profileStore = useProfileStore();
const uiStore = useUiStore();
const { t } = useI18n();

const selectedRateChip = ref(HOME_ALL_FILTER_KEY);
const selectedCountry = ref<string | null>(null);
const selectedCityId = ref<string | null>(null);
const ratesExpanded = ref(false);
const showReferralBanner = false;
const socialLinks = [
  {
    id: 'reviews',
    titleKey: 'home.social.links.reviews.title',
    subtitleKey: 'home.social.links.reviews.subtitle',
    href: 'https://t.me/+Rw2BRymXRnk1ZGUy',
    icon: 'fa-brands fa-telegram',
  },
  {
    id: 'news',
    titleKey: 'home.social.links.news.title',
    subtitleKey: '',
    href: 'https://t.me/+vN7FXrXBReszNDg1',
    icon: 'fa-brands fa-telegram',
  },
  {
    id: 'instagram',
    titleKey: 'home.social.links.instagram.title',
    subtitleKey: 'home.social.links.instagram.subtitle',
    href: 'https://www.instagram.com/antex.change',
    icon: 'fa-brands fa-instagram',
  },
  {
    id: 'vk',
    titleKey: 'home.social.links.vk.title',
    subtitleKey: 'home.social.links.vk.subtitle',
    href: 'https://vk.ru/antex.finance',
    icon: 'fa-brands fa-vk',
  },
  {
    id: 'max',
    titleKey: 'home.social.links.max.title',
    subtitleKey: 'home.social.links.max.subtitle',
    href: 'https://max.ru/join/UgGFm4-mQ2lg33aJvK80IZwjxWGF3z-7QL61i-_CMVU',
    icon: null,
    maxMark: 'MAX',
  },
  {
    id: 'threads',
    titleKey: 'home.social.links.threads.title',
    subtitleKey: 'home.social.links.threads.subtitle',
    href: 'https://www.threads.com/@antex.change?igshid=NTc4MTIwNjQ2YQ==',
    icon: 'fa-brands fa-threads',
  },
] as const;
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
const managerTelegramHref = computed(() => {
  const supportHref = profileStore.data?.menu.find((item) => item.id === 'support' && item.action === 'link')?.href?.trim();
  if (supportHref) {
    return supportHref;
  }

  const fallbackUsername = (import.meta.env.VITE_TG_BOT_USERNAME as string | undefined)?.trim().replace(/^@/, '');
  return fallbackUsername ? `https://t.me/${fallbackUsername}` : null;
});

onMounted(async () => {
  if (!homeStore.loaded || !homeStore.data) {
    await homeStore.load();
  } else {
    void homeStore.refresh();
  }

  if (!profileStore.loaded || !profileStore.data) {
    await profileStore.load();
  } else {
    void profileStore.refresh();
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
    rate: card.calculationRate,
    country: selectedCountry.value ?? card.country,
    cityId: selectedCityId.value ? Number(selectedCityId.value) : null,
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
 * Переключает preview/full список пар текущего фильтра прямо в home-блоке.
 */
function toggleRatesExpansion() {
  ratesExpanded.value = !ratesExpanded.value;
}
</script>
