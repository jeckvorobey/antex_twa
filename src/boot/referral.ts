import { defineBoot } from '#q-app/wrappers';

import { applyReferralCode } from '@services/api/miniapp.service';

const REFERRAL_STORAGE_KEY = 'antex_ref_code';

/**
 * Handles Telegram Mini App deep-link referral parameter.
 * Format: https://t.me/<bot>?startapp=ref_<code>
 *
 * On init:
 * 1. Reads start_param from Telegram WebApp initDataUnsafe
 * 2. If it starts with 'ref_', saves the code and sends to backend
 * 3. Also checks URL search params as fallback for non-Telegram environments
 */
export default defineBoot(async () => {
  const refCode = extractRefCode();

  if (!refCode) {
    return;
  }

  // Store locally for reference
  localStorage.setItem(REFERRAL_STORAGE_KEY, refCode);

  // Send to backend (fire-and-forget, don't block app init)
  try {
    await applyReferralCode(refCode);
  } catch {
    // Silently ignore — backend may not be ready yet,
    // or code may already be applied
  }
});

function extractRefCode(): string | null {
  // 1. Telegram start_param
  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.start_param) {
    const param = tg.initDataUnsafe.start_param;
    if (param.startsWith('ref_')) {
      return param.slice(4); // strip 'ref_' prefix
    }
  }

  // 2. URL search params fallback (dev / non-Telegram environment)
  try {
    const url = new URL(window.location.href);
    const startapp = url.searchParams.get('startapp') ?? url.searchParams.get('tgWebAppStartParam');
    if (startapp?.startsWith('ref_')) {
      return startapp.slice(4);
    }
  } catch {
    // URL parsing failed — ignore
  }

  return null;
}
