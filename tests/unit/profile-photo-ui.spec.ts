import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const profilePath = resolve(process.cwd(), 'src/pages/ProfilePage.vue');

describe('profile photo UI', () => {
  it('renders Telegram photo in profile hero with icon fallback', () => {
    const source = readFileSync(profilePath, 'utf8');

    expect(source).toContain('<q-img');
    expect(source).toContain('v-if="profilePhotoUrl"');
    expect(source).toContain(':src="profilePhotoUrl"');
    expect(source).toContain('v-else');
    expect(source).toContain('person_outline');
  });
});
