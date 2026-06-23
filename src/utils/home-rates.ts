import type { MiniappLocationItem, MiniappRateCard } from '@types/miniapp';
import { getCurrencyBadge, normalizeCityLabel, normalizeCountryLabel } from '@utils/display';

export const HOME_ALL_FILTER_KEY = 'ALL';
const HOME_RATE_DISPLAY_PRIORITY = ['RUB', 'USDT', 'THB', 'GEL', 'VND'] as const;

export interface HomeRateCardSide {
  title: string;
  flag: string;
  meta: string;
}

export interface HomeRateCardPresentation {
  left: HomeRateCardSide;
  right: HomeRateCardSide;
  ratePrefix: string;
}

export interface BuildHomeRateCardPresentationParams {
  card: MiniappRateCard;
  selectedCityId: string | null;
}

export interface HomeRateFilterChip {
  key: string;
  label: string;
}

export interface BuildHomeRateFilterChipsParams {
  backendChips: string[];
  allLabel: string;
  rates: MiniappRateCard[];
  selectedCountry: string | null;
}

export interface BuildHomeRateViewParams {
  rates: MiniappRateCard[];
  filterKey: string;
  previewLimit: number;
  expanded: boolean;
  selectedCountry: string | null;
}

export interface HomeRateView {
  filteredRates: MiniappRateCard[];
  visibleRates: MiniappRateCard[];
  canExpand: boolean;
}

export function buildHomeRateFilterChips({
  backendChips,
  allLabel,
  rates,
  selectedCountry,
}: BuildHomeRateFilterChipsParams): HomeRateFilterChip[] {
  const countryRates = selectedCountry
    ? rates.filter((rate) => rate.country === selectedCountry)
    : rates;
  const availableCurrencies = new Set(
    countryRates.flatMap((rate) => [rate.fromCurrency, rate.toCurrency]),
  );

  return [
    { key: HOME_ALL_FILTER_KEY, label: allLabel },
    ...backendChips
      .filter((chip) => availableCurrencies.has(chip))
      .map((chip) => ({ key: chip, label: chip })),
  ];
}

export function buildHomeRateView({
  rates,
  filterKey,
  previewLimit,
  expanded,
  selectedCountry,
}: BuildHomeRateViewParams): HomeRateView {
  const countryRates = selectedCountry
    ? rates.filter((rate) => rate.country === selectedCountry)
    : rates;
  const filteredRates =
    filterKey === HOME_ALL_FILTER_KEY
      ? countryRates
      : countryRates.filter(
          (rate) => rate.fromCurrency === filterKey || rate.toCurrency === filterKey,
        );
  const canExpand = filteredRates.length > previewLimit;

  return {
    filteredRates,
    visibleRates: expanded || !canExpand ? filteredRates : filteredRates.slice(0, previewLimit),
    canExpand,
  };
}

export function buildHomeVisibleLocations(
  locations: MiniappLocationItem[],
  selectedCountry: string | null,
) {
  const visibleLocations = !selectedCountry
    ? locations
    : locations.filter((location) => location.country === selectedCountry);

  return visibleLocations.map((location) => ({
    ...location,
    city: normalizeCityLabel(location.city),
    countryLabel: normalizeCountryLabel(location.countryLabel),
  }));
}

export function resolveHomeCountryByCity(locations: MiniappLocationItem[], cityId: string) {
  return locations.find((location) => location.id === cityId)?.country ?? null;
}

export function buildHomeAvailableMethods(selectedCityId: string | null) {
  return selectedCityId
    ? ['qrcode', 'cash', 'bank_account', 'pay_services']
    : ['qrcode', 'bank_account', 'pay_services'];
}

export function resetHomeRateExpansion(_expanded: boolean) {
  return false;
}

export function buildHomeRateCardPresentation({
  card,
  selectedCityId,
}: BuildHomeRateCardPresentationParams): HomeRateCardPresentation {
  const [leftCurrency, rightCurrency] = sortHomeRateCurrencies(card.fromCurrency, card.toCurrency);

  return {
    left: {
      title: leftCurrency,
      flag: getCurrencyBadge(leftCurrency),
      meta: getHomeRateSourceLabel(leftCurrency),
    },
    right: {
      title: rightCurrency,
      flag: getCurrencyBadge(rightCurrency),
      meta: selectedCityId ? 'QR, доставка, перевод' : 'QR, перевод',
    },
    ratePrefix: 'от',
  };
}

function getHomeRateSourceLabel(currency: string) {
  return currency === 'USDT' ? 'перевод' : 'СБП, перевод';
}

function sortHomeRateCurrencies(left: string, right: string): [string, string] {
  const leftPriority = HOME_RATE_DISPLAY_PRIORITY.indexOf(
    left as (typeof HOME_RATE_DISPLAY_PRIORITY)[number],
  );
  const rightPriority = HOME_RATE_DISPLAY_PRIORITY.indexOf(
    right as (typeof HOME_RATE_DISPLAY_PRIORITY)[number],
  );

  if (leftPriority === -1 || rightPriority === -1) {
    return [left, right];
  }

  return leftPriority <= rightPriority ? [left, right] : [right, left];
}
