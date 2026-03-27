export interface ExchangeRates {
  rubthb: number;
  allowance: number;
  rates: RateItem[];
}

export interface RateItem {
  id: number;
  currency: string;
  price: number;
}

export interface Order {
  id: number;
  UserId: number;
  BankId: number;
  CardId: number | null;
  currencySell: string;
  amountSell: number;
  currencyBuy: string;
  amountBuy: number;
  rate: number;
  status: number;
  methodGet: string | null;
  createdAt: string;
}
