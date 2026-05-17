export interface SwapExchangeDirectionParams {
  currencySell: string;
  currencyBuy: string;
  amountSell: number | null;
  amountBuy?: number | null;
  useQuotedAmountBuy?: boolean;
}

export interface SwappedExchangeDirection {
  currencySell: string;
  currencyBuy: string;
  amountSell: number | null;
}

export interface ExchangePairLike {
  fromCurrency: string;
  toCurrency: string;
}

export function swapExchangeDirection(
  params: SwapExchangeDirectionParams,
): SwappedExchangeDirection {
  const shouldUseQuotedAmountBuy = params.useQuotedAmountBuy !== false;

  return {
    currencySell: params.currencyBuy,
    currencyBuy: params.currencySell,
    amountSell: shouldUseQuotedAmountBuy ? params.amountBuy ?? params.amountSell : params.amountSell,
  };
}

/**
 * Строит варианты валюты получения из backend-driven списка пар.
 */
export function buildBuyCurrencyOptions(
  pairs: ExchangePairLike[],
  currencySell: string,
) {
  return pairs
    .flatMap((pair) => [
      [pair.fromCurrency, pair.toCurrency],
      [pair.toCurrency, pair.fromCurrency],
    ])
    .filter(([sell]) => sell === currencySell)
    .map(([, buy]) => buy)
    .filter((buy, index, items) => items.indexOf(buy) === index)
    .map((currency) => ({
      label: currency,
      value: currency,
    }));
}

/**
 * Выбирает способ получения по quote или дефолту для валюты покупки.
 */
export function getDefaultReceiveMethod(
  currencyBuy: string,
  availableMethods?: string[] | null,
) {
  if (availableMethods?.includes('cash')) {
    return 'cash';
  }

  if (availableMethods?.includes('qrcode')) {
    return 'qrcode';
  }

  if (availableMethods?.[0]) {
    return availableMethods[0];
  }

  if (currencyBuy === 'USDT') {
    return 'wallet';
  }

  if (currencyBuy === 'RUB') {
    return 'card';
  }

  return 'cash';
}
