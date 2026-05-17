import type { MiniappLocationItem, MiniappRateCard } from '@types/miniapp';

export const HOME_ALL_FILTER_KEY = 'ALL';

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
  const filteredRates = filterKey === HOME_ALL_FILTER_KEY
    ? countryRates
    : countryRates.filter((rate) => rate.fromCurrency === filterKey || rate.toCurrency === filterKey);
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
  if (!selectedCountry) {
    return locations;
  }

  return locations.filter((location) => location.country === selectedCountry);
}

export function resolveHomeCountryByCity(
  locations: MiniappLocationItem[],
  cityId: string,
) {
  return locations.find((location) => location.id === cityId)?.country ?? null;
}

export function buildHomeAvailableMethods(selectedCityId: string | null) {
  return selectedCityId ? ['qrcode', 'cash'] : ['qrcode'];
}

export function resetHomeRateExpansion(_expanded: boolean) {
  return false;
}
