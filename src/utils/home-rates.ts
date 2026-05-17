import type { MiniappRateCard } from '@types/miniapp';

export const HOME_ALL_FILTER_KEY = 'ALL';

export interface HomeRateFilterChip {
  key: string;
  label: string;
}

export interface BuildHomeRateViewParams {
  rates: MiniappRateCard[];
  filterKey: string;
  previewLimit: number;
  expanded: boolean;
}

export interface HomeRateView {
  filteredRates: MiniappRateCard[];
  visibleRates: MiniappRateCard[];
  canExpand: boolean;
}

/**
 * Добавляет локальный фильтр "Все" перед backend-driven валютами.
 */
export function buildHomeRateFilterChips(
  backendChips: string[],
  allLabel: string,
): HomeRateFilterChip[] {
  return [
    { key: HOME_ALL_FILTER_KEY, label: allLabel },
    ...backendChips.map((chip) => ({ key: chip, label: chip })),
  ];
}

/**
 * Строит видимый список карточек и состояние inline-expand для главной.
 */
export function buildHomeRateView({
  rates,
  filterKey,
  previewLimit,
  expanded,
}: BuildHomeRateViewParams): HomeRateView {
  const filteredRates = filterKey === HOME_ALL_FILTER_KEY
    ? rates
    : rates.filter((rate) => rate.fromCurrency === filterKey || rate.toCurrency === filterKey);
  const canExpand = filteredRates.length > previewLimit;

  return {
    filteredRates,
    visibleRates: expanded || !canExpand ? filteredRates : filteredRates.slice(0, previewLimit),
    canExpand,
  };
}

/**
 * Сбрасывает раскрытое состояние при смене фильтра или новой загрузке экрана.
 */
export function resetHomeRateExpansion(_expanded: boolean) {
  return false;
}
