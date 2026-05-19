import type { MiniappQuoteResponse } from '@types/miniapp';

export interface ExchangePairLike {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  country?: string;
  countryLabel?: string;
  rate?: number;
  availableMethods?: string[];
}

export type ExchangeEditedField = 'sell' | 'buy';

export interface LocalQuoteParams {
  pairs: ExchangePairLike[];
  referenceQuote: MiniappQuoteResponse | null;
  currencySell: string;
  currencyBuy: string;
  amountSell: number | null;
  amountBuy: number | null;
  lastEdited: ExchangeEditedField;
}

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

export function getDefaultReceiveMethod(
  currencyBuy: string,
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

function resolvePairRate(
  pairs: ExchangePairLike[],
  referenceQuote: MiniappQuoteResponse | null,
  currencySell: string,
  currencyBuy: string,
) {
  if (
    referenceQuote
    && referenceQuote.currencySell === currencySell
    && referenceQuote.currencyBuy === currencyBuy
  ) {
    return {
      rate: referenceQuote.rate,
      availableMethods: referenceQuote.availableMethods,
    };
  }

  const directPair = pairs.find((pair) => {
    const canonical = parsePairId(pair.id);
    return canonical.currencySell === currencySell && canonical.currencyBuy === currencyBuy;
  });
  if (directPair?.rate && directPair.rate > 0) {
    if (directPair.fromCurrency === currencySell && directPair.toCurrency === currencyBuy) {
      return {
        rate: directPair.rate,
        availableMethods: directPair.availableMethods ?? [],
      };
    }

    if (directPair.fromCurrency === currencyBuy && directPair.toCurrency === currencySell) {
      return {
        rate: roundMoney(1 / directPair.rate),
        availableMethods: directPair.availableMethods ?? [],
      };
    }
  }

  return null;
}

export function calculateLocalQuote(params: LocalQuoteParams): MiniappQuoteResponse | null {
  const rateSource = resolvePairRate(
    params.pairs,
    params.referenceQuote,
    params.currencySell,
    params.currencyBuy,
  );
  if (!rateSource) {
    return null;
  }

  let amountSell = params.amountSell ?? null;
  let amountBuy = params.amountBuy ?? null;

  if (params.lastEdited === 'sell') {
    if (!amountSell || amountSell <= 0) {
      return null;
    }
    amountBuy = roundMoney(amountSell * rateSource.rate);
  } else {
    if (!amountBuy || amountBuy <= 0) {
      return null;
    }
    amountSell = roundMoney(amountBuy / rateSource.rate);
  }

  return {
    currencySell: params.currencySell,
    currencyBuy: params.currencyBuy,
    amountSell,
    amountBuy: amountBuy ?? 0,
    rate: rateSource.rate,
    rateDisplay: rateSource.rate.toFixed(2),
    rateText: `1 ${params.currencySell} = ${rateSource.rate.toFixed(2)} ${params.currencyBuy}`,
    updatedAt: params.referenceQuote?.updatedAt ?? new Date().toISOString(),
    availableMethods: rateSource.availableMethods,
  };
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

export function resetCityForMethod(method: string, cityId: number | null) {
  if (method === 'qrcode') {
    return null;
  }
  return cityId;
}
