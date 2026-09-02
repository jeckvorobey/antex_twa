import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const nginxSource = readFileSync(resolve(process.cwd(), 'nginx.conf'), 'utf8');

describe('production security headers', () => {
  it('adds non-breaking browser hardening headers globally', () => {
    expect(nginxSource).toContain('X-Content-Type-Options "nosniff" always');
    expect(nginxSource).toContain('Referrer-Policy "strict-origin-when-cross-origin" always');
    expect(nginxSource).toContain(
      'Permissions-Policy "camera=(self), microphone=(self), geolocation=()" always',
    );
  });

  it('разрешает запись только своему origin во всех nginx location без запрета на уровне assets', () => {
    const policies = [...nginxSource.matchAll(/add_header Permissions-Policy "([^"]+)" always/g)];
    expect(policies).toHaveLength(2);
    for (const [, policy] of policies) {
      expect(policy).toBe('camera=(self), microphone=(self), geolocation=()');
    }
  });

  it('allows framing only from the Mini App origin and Telegram Web', () => {
    const policy =
      'Content-Security-Policy "frame-ancestors \'self\' https://web.telegram.org https://*.web.telegram.org" always';

    expect(
      nginxSource.match(new RegExp(policy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')),
    ).toHaveLength(2);
  });
});
