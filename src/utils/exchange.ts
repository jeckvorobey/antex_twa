import type { MiniappCity, MiniappQuoteResponse } from '@types/miniapp';
import { normalizeCityLabel, normalizeCountryLabel } from '@utils/display';

export interface ExchangePairLike {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amountSellExample?: number;
  country?: string;
  countryLabel?: string;
  countryFlag?: string;
  rate?: number;
  calculationRate?: number;
  rateDisplay?: string;
  rateText?: string;
  updatedAt?: string;
  availableMethods?: string[];
}

export interface ExchangeOption {
  label: string;
  value: string;
  mark?: string;
}

export interface ExchangeCityOption {
  label: string;
  value: number;
  mark: string;
}

export interface LocalQuoteParams {
  pairs: ExchangePairLike[];
  currencySell: string;
  currencyBuy: string;
  amountSell: number | null;
}

export interface PreliminaryOrderValidationParams {
  pairs: ExchangePairLike[];
  cities: MiniappCity[];
  currencySell: string;
  currencyBuy: string;
  amountSell: number | null;
  selectedCountry: string | null;
  selectedMethod: 'qrcode' | 'cash';
  selectedCityId: number | null;
}

export type PreliminaryOrderValidationResult =
  | { valid: true }
  | { valid: false; messageKey: string; params?: Record<string, string | number> };

/**
 * Возвращает canonical sell/buy из pair id `rub-thb`.
 */
function parsePairId(id: string) {
  const [currencySell = '', currencyBuy = ''] = id.split('-');
  return {
    currencySell: currencySell.toUpperCase(),
    currencyBuy: currencyBuy.toUpperCase(),
  };
}

function normalizeCountryKey(value: unknown): string {
  if (!value) {
    return '';
  }

  const raw = String(value).trim().toLowerCase();
  const withoutPrefix = raw.replace(/^country\./, '');
  const map: Record<string, string> = {
    th: 'thailand',
    thailand: 'thailand',
    тайланд: 'thailand',
    vn: 'vietnam',
    vietnam: 'vietnam',
    вьетнам: 'vietnam',
    ge: 'georgia',
    georgia: 'georgia',
    грузия: 'georgia',
  };

  return map[withoutPrefix] ?? withoutPrefix;
}

/**
 * Строит варианты валюты получения из backend-driven списка pair ids.
 */
export function buildBuyCurrencyOptions(
  pairs: ExchangePairLike[],
  currencySell: string,
) {
  return pairs
    .map((pair) => parsePairId(pair.id))
    .filter((pair) => pair.currencySell === currencySell)
    .map((pair) => pair.currencyBuy)
    .filter((buy, index, items) => items.indexOf(buy) === index)
    .map((currency) => ({ label: currency, value: currency }));
}

export function buildCountryOptions(
  pairs: ExchangePairLike[],
  currencySell: string,
): ExchangeOption[] {
  return buildBuyCurrencyOptions(pairs, currencySell)
    .map((option) => ({
      value: getCountryByCurrency(pairs, option.value),
      label: normalizeCountryLabel(
        getCountryLabelByCurrency(pairs, option.value) ?? option.value,
      ),
      mark: getCountryFlagByCurrency(pairs, option.value),
    }))
    .filter((option): option is ExchangeOption => Boolean(option.value));
}

export function getDefaultReceiveMethod(
  _currencyBuy: string,
  availableMethods: string[] | null,
): 'qrcode' | 'cash' {
  if (availableMethods?.includes('qrcode')) {
    return 'qrcode';
  }

  if (availableMethods?.includes('cash')) {
    return 'cash';
  }

  return 'qrcode';
}

export function getPreferredReceiveMethod(
  availableMethods: string[] | null,
  selectedCityId: number | null,
): 'qrcode' | 'cash' {
  if (selectedCityId && availableMethods?.includes('cash')) {
    return 'cash';
  }

  return getDefaultReceiveMethod('', availableMethods);
}

export function getReceiveLocationTitleKey(method: 'qrcode' | 'cash') {
  return method === 'cash' ? 'exchange.cash' : 'exchange.qrcodeCountries';
}

export function buildReceiveLocationLabel(params: {
  method: 'qrcode' | 'cash';
  countryLabel: string | null;
  cityLabel?: string | null;
}) {
  if (!params.countryLabel) {
    return null;
  }

  if (params.method !== 'cash' || !params.cityLabel) {
    return params.countryLabel;
  }

  return `${params.countryLabel}, ${params.cityLabel}`;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function getFallbackDefaultAmountSell(currencySell: string) {
  return currencySell.toUpperCase() === 'USDT' ? 100 : 5000;
}

function resolvePairDefaultAmountSell(
  pairs: ExchangePairLike[],
  currencySell: string,
  currencyBuy: string,
) {
  const pair = pairs.find((item) => {
    const parsed = parsePairId(item.id);
    return parsed.currencySell === currencySell.toUpperCase() && parsed.currencyBuy === currencyBuy.toUpperCase();
  });
  return pair && typeof pair.amountSellExample === 'number'
    ? pair.amountSellExample
    : getFallbackDefaultAmountSell(currencySell);
}

function resolveExpectedCountryByBuyCurrency(
  pairs: ExchangePairLike[],
  currencyBuy: string,
) {
  const directPair = pairs.find((item) => parsePairId(item.id).currencyBuy === currencyBuy.toUpperCase());
  return normalizeCountryKey(directPair?.country);
}

export function calculateLocalQuote(params: LocalQuoteParams): MiniappQuoteResponse | null {
  if (!params.amountSell || params.amountSell <= 0) {
    return null;
  }

  const pair = params.pairs.find((item) => {
    const parsed = parsePairId(item.id);
    return parsed.currencySell === params.currencySell && parsed.currencyBuy === params.currencyBuy;
  });

  const rate = pair?.calculationRate ?? pair?.rate;
  if (!rate || rate <= 0) {
    return null;
  }

  return {
    currencySell: params.currencySell,
    currencyBuy: params.currencyBuy,
    amountSell: params.amountSell,
    amountBuy: roundMoney(params.amountSell * rate),
    rate,
    rateDisplay: rate.toFixed(2),
    rateText: `1 ${params.currencySell} = ${rate.toFixed(2)} ${params.currencyBuy}`,
    updatedAt: pair.updatedAt ?? new Date().toISOString(),
    availableMethods: pair.availableMethods ?? [],
  };
}

export function validatePreliminaryOrderDraft(
  params: PreliminaryOrderValidationParams,
): PreliminaryOrderValidationResult {
  const minimumAmountSell = resolvePairDefaultAmountSell(
    params.pairs,
    params.currencySell,
    params.currencyBuy,
  );
  const normalizedCountry = normalizeCountryKey(params.selectedCountry);
  const expectedCountry = resolveExpectedCountryByBuyCurrency(params.pairs, params.currencyBuy);

  if (!params.amountSell || params.amountSell < minimumAmountSell) {
    return {
      valid: false,
      messageKey: 'errors.exchange_min_amount',
      params: { amount: minimumAmountSell, currency: params.currencySell.toUpperCase() },
    };
  }

  if (!normalizedCountry) {
    return { valid: false, messageKey: 'errors.country_required' };
  }

  if (expectedCountry && normalizedCountry !== expectedCountry) {
    return { valid: false, messageKey: 'errors.country_currency_mismatch' };
  }

  if (params.selectedMethod !== 'cash') {
    return { valid: true };
  }

  if (params.selectedCityId == null) {
    return { valid: false, messageKey: 'errors.city_required' };
  }

  const selectedCity = params.cities.find((city) => city.id === params.selectedCityId);
  if (!selectedCity) {
    return { valid: false, messageKey: 'errors.city_required' };
  }

  const cityCountry = normalizeCountryKey(selectedCity.country);
  if (cityCountry !== normalizedCountry) {
    return { valid: false, messageKey: 'errors.city_country_mismatch' };
  }

  return { valid: true };
}

export function getCountryByCurrency(
  pairs: ExchangePairLike[],
  currencyBuy: string,
) {
  const directPair = pairs.find((pair) => parsePairId(pair.id).currencyBuy === currencyBuy);
  return directPair?.country ?? null;
}

export function getCountryLabelByCurrency(
  pairs: ExchangePairLike[],
  currencyBuy: string,
) {
  const directPair = pairs.find((pair) => parsePairId(pair.id).currencyBuy === currencyBuy);
  return directPair?.countryLabel ?? null;
}

export function getCurrencyByCountry(
  pairs: ExchangePairLike[],
  country: string,
) {
  const directPair = pairs.find((pair) => pair.country === country);
  return directPair ? parsePairId(directPair.id).currencyBuy : null;
}

export function getCountryFlagByCurrency(
  pairs: ExchangePairLike[],
  currencyBuy: string,
) {
  const directPair = pairs.find((pair) => parsePairId(pair.id).currencyBuy === currencyBuy);
  return directPair?.countryFlag ?? '';
}

export function buildCityOptions(
  cities: MiniappCity[],
  selectedCountry: string | null,
): ExchangeCityOption[] {
  const normalizedSelectedCountry = normalizeCountryKey(selectedCountry);
  if (!normalizedSelectedCountry) {
    return [];
  }

  return cities
    .filter((city) => {
      const candidates = [
        normalizeCountryKey(city.country),
        normalizeCountryKey(city.countryCode),
        normalizeCountryKey(city.countryRuName),
      ];

      return candidates.includes(normalizedSelectedCountry);
    })
    .map((city) => ({
      label: normalizeCityLabel(city.name),
      value: city.id,
      mark: city.countryFlag,
    }));
}

export function resetCityForMethod(method: string, cityId: number | null) {
  if (method === 'qrcode') {
    return null;
  }
  return cityId;
}
