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
