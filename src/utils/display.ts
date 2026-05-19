const COUNTRY_LABEL_FIXES: Record<string, string> = {
  Тайланд: 'Таиланд',
};

const CITY_LABEL_FIXES: Record<string, string> = {
  Паттая: 'Паттайя',
};

export function normalizeCountryLabel(label: string | null | undefined): string {
  if (!label) {
    return '';
  }

  return COUNTRY_LABEL_FIXES[label] ?? label;
}

export function normalizeCityLabel(label: string | null | undefined): string {
  if (!label) {
    return '';
  }

  return CITY_LABEL_FIXES[label] ?? label;
}

export function getCurrencyBadge(currency: string): string {
  switch (currency) {
    case 'RUB':
      return '🇷🇺';
    case 'THB':
      return '🇹🇭';
    case 'GEL':
      return '🇬🇪';
    case 'VND':
      return '🇻🇳';
    case 'USDT':
      return 'USDT';
    default:
      return '🏳️';
  }
}
