import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHomeStore } from '@stores/home.store';
import { useProfileStore } from '@stores/profile.store';
import type { MiniappHomeResponse, MiniappProfileResponse } from '@types/miniapp';

vi.mock('@services/api/miniapp.service', () => ({
  fetchHome: vi.fn(),
  fetchProfile: vi.fn(),
}));

import { fetchHome, fetchProfile } from '@services/api/miniapp.service';

function makeHomeResponse(rateText: string): MiniappHomeResponse {
  return {
    rateCards: [],
    featuredRates: [],
    primaryAction: {
      title: 'Обменять',
      subtitle: 'Быстрый обмен',
    },
    rateView: {
      expanded: false,
      canExpand: false,
      collapsedCount: 0,
      expandedCount: 0,
    },
    rateText,
    services: [],
  };
}

function makeProfileResponse(firstName: string): MiniappProfileResponse {
  return {
    user: {
      id: 7,
      telegramId: 77,
      firstName,
      lastName: 'User',
      username: 'antex_user',
      photoUrl: null,
      languageCode: 'ru',
      role: 'user',
      isActive: true,
      createdAt: '2026-05-29T00:00:00+00:00',
      updatedAt: '2026-05-29T00:00:00+00:00',
    },
    menu: [],
  };
}

describe('background refresh store contracts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('refreshes home data without enabling initial loading flag', async () => {
    const store = useHomeStore();
    vi.mocked(fetchHome)
      .mockResolvedValueOnce(makeHomeResponse('old'))
      .mockResolvedValueOnce(makeHomeResponse('new'));

    await store.load();
    const refreshPromise = store.refresh();

    expect(store.loading).toBe(false);
    expect(store.refreshing).toBe(true);

    await refreshPromise;

    expect(store.data?.rateText).toBe('new');
    expect(store.refreshing).toBe(false);
  });

  it('refreshes profile data without enabling initial loading flag', async () => {
    const store = useProfileStore();
    vi.mocked(fetchProfile)
      .mockResolvedValueOnce(makeProfileResponse('Old'))
      .mockResolvedValueOnce(makeProfileResponse('New'));

    await store.load();
    const refreshPromise = store.refresh();

    expect(store.loading).toBe(false);
    expect(store.refreshing).toBe(true);

    await refreshPromise;

    expect(store.data?.user.firstName).toBe('New');
    expect(store.refreshing).toBe(false);
  });
});
