import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const nginxSource = readFileSync(resolve(process.cwd(), 'nginx.conf'), 'utf8');

describe('production security headers', () => {
  it('adds non-breaking browser hardening headers globally', () => {
    expect(nginxSource).toContain('X-Content-Type-Options "nosniff" always');
    expect(nginxSource).toContain('Referrer-Policy "strict-origin-when-cross-origin" always');
    expect(nginxSource).toContain(
      'Permissions-Policy "camera=(), microphone=(), geolocation=()" always',
    );
  });

  it('restricts executable content while allowing the official Telegram SDK', () => {
    expect(nginxSource).toContain(
      'Content-Security-Policy "default-src \'self\'; script-src \'self\' https://telegram.org; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' data: https://fonts.gstatic.com; img-src \'self\' data: blob: https:; connect-src \'self\' https:; object-src \'none\'; base-uri \'self\'; form-action \'self\'" always',
    );
    expect(nginxSource).not.toContain("'unsafe-eval'");
  });
});
