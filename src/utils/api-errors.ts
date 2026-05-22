const MINIAPP_ERROR_KEYS: Record<string, string> = {
  ORDER_ALREADY_EXISTS: 'errors.order_exists',
  RATE_UNAVAILABLE: 'errors.rate_unavailable',
  RATE_PAIR_UNAVAILABLE: 'errors.unsupported_pair',
  UNSUPPORTED_PAIR: 'errors.unsupported_pair',
  CITY_MANAGER_NOT_CONFIGURED: 'errors.city_manager_missing',
  TRUSTED_CONTACT_NOT_READY: 'errors.trusted_contact_not_ready',
  CITY_REQUIRED_FOR_CASH: 'errors.city_required',
};

/**
 * Возвращает i18n-key для machine-readable кода backend.
 */
export function getMiniappErrorMessageKey(code?: string | null) {
  if (!code) {
    return 'errors.generic';
  }

  return MINIAPP_ERROR_KEYS[code] ?? 'errors.generic';
}
