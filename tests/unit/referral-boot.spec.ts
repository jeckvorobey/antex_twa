import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const bootPath = resolve(process.cwd(), 'src/boot/referral.ts');
const bootSource = readFileSync(bootPath, 'utf8');

describe('Referral deep-link boot', () => {
  it('extracts referral code from Telegram start_param', () => {
    expect(bootSource).toContain('initDataUnsafe?.start_param');
    expect(bootSource).toContain("param.startsWith('ref_')");
    expect(bootSource).toContain('param.slice(4)');
  });

  it('falls back to URL search params for non-Telegram env', () => {
    expect(bootSource).toContain('searchParams.get');
    expect(bootSource).toContain("'startapp'");
    expect(bootSource).toContain("'tgWebAppStartParam'");
  });

  it('stores code in localStorage', () => {
    expect(bootSource).toContain('localStorage.setItem');
    expect(bootSource).toContain('antex_ref_code');
  });

  it('calls applyReferralCode API', () => {
    expect(bootSource).toContain('applyReferralCode(refCode)');
  });

  it('silently ignores API errors', () => {
    expect(bootSource).toContain('catch');
    expect(bootSource).not.toContain('throw');
  });

  it('uses defineBoot wrapper', () => {
    expect(bootSource).toContain('defineBoot');
  });
});
