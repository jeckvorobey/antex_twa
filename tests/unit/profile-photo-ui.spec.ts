import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const headerPath = resolve(process.cwd(), 'src/components/ui/AppHeaderBar.vue');
const profilePath = resolve(process.cwd(), 'src/pages/ProfilePage.vue');

describe('profile photo UI', () => {
  it('renders Telegram photo in the header avatar with initials fallback', () => {
    const source = readFileSync(headerPath, 'utf8');

    expect(source).toContain('<q-avatar');
    expect(source).toContain('v-if="userPhotoUrl"');
    expect(source).toContain(':src="userPhotoUrl"');
    expect(source).toContain('v-else');
    expect(source).toContain('{{ userInitials }}');
  });

  it('renders Telegram photo in profile hero with icon fallback', () => {
    const source = readFileSync(profilePath, 'utf8');

    expect(source).toContain('<q-img');
    expect(source).toContain('v-if="profilePhotoUrl"');
    expect(source).toContain(':src="profilePhotoUrl"');
    expect(source).toContain('v-else');
    expect(source).toContain('person_outline');
  });
});
