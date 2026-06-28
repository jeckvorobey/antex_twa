import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@boot/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@services/api/miniapp.service', () => ({
  fetchAexReferralInfo: vi.fn(),
  fetchAexTransactions: vi.fn(),
  applyReferralCode: vi.fn(),
}));

import { fetchAexReferralInfo, fetchAexTransactions } from '@services/api/miniapp.service';
import { useAexStore } from '@stores/aex.store';

describe('AEX store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads referral info and sets state', async () => {
    const mockReferralInfo = {
      referralCode: 'ABC123',
      referralLink: 'https://t.me/bot?startapp=ref_ABC123',
      totalReferrals: 1,
      programConfig: {
        referralPercent: '0.35',
        referralMinWithdraw: '250',
        referralMaxWithdraw: null,
        aexRate: '1',
      },
    };
    vi.mocked(fetchAexReferralInfo).mockResolvedValue(mockReferralInfo);

    const store = useAexStore();
    await store.loadReferral();

    expect(store.referralInfo).toEqual(mockReferralInfo);
    expect(store.referralLoaded).toBe(true);
    expect(store.referralLoading).toBe(false);
    expect(store.totalReferrals).toBe(1);
    expect(store.referralInfo?.programConfig.referralPercent).toBe('0.35');
  });

  it('prevents duplicate referral loading', async () => {
    vi.mocked(fetchAexReferralInfo).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    const store = useAexStore();
    store.referralLoading = true;

    await store.loadReferral();

    expect(fetchAexReferralInfo).not.toHaveBeenCalled();
  });

  it('loads first page of transactions', async () => {
    const mockResponse = {
      items: [
        {
          id: 1,
          type: 'referral_reward' as const,
          amount: 10,
          balanceAfter: 10,
          description: 'Reward',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      limit: 20,
      offset: 0,
      total: 1,
      hasMore: false,
    };
    vi.mocked(fetchAexTransactions).mockResolvedValue(mockResponse);

    const store = useAexStore();
    await store.loadFirstPage();

    expect(store.transactions).toHaveLength(1);
    expect(store.txLoaded).toBe(true);
    expect(store.txHasMore).toBe(false);
    expect(store.txTotal).toBe(1);
    expect(fetchAexTransactions).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it('loads next page and deduplicates items', async () => {
    const page1 = {
      items: [
        {
          id: 1,
          type: 'referral_reward' as const,
          amount: 10,
          balanceAfter: 10,
          description: 'Reward 1',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      limit: 20,
      offset: 0,
      total: 2,
      hasMore: true,
    };
    const page2 = {
      items: [
        {
          id: 1,
          type: 'referral_reward' as const,
          amount: 10,
          balanceAfter: 10,
          description: 'Reward 1',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          type: 'bonus' as const,
          amount: 5,
          balanceAfter: 15,
          description: 'Bonus',
          createdAt: '2026-01-02T00:00:00Z',
        },
      ],
      limit: 20,
      offset: 1,
      total: 2,
      hasMore: false,
    };

    vi.mocked(fetchAexTransactions).mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    const store = useAexStore();
    await store.loadFirstPage();
    await store.loadNextPage();

    // Should have 2 items (duplicate id=1 filtered out)
    expect(store.transactions).toHaveLength(2);
    expect(store.txHasMore).toBe(false);
  });

  it('prevents duplicate next page loading', async () => {
    const store = useAexStore();
    store.txLoading = true;

    await store.loadNextPage();

    expect(fetchAexTransactions).not.toHaveBeenCalled();
  });

  it('refreshes transactions and resets state', async () => {
    const mockResponse = {
      items: [
        {
          id: 3,
          type: 'bonus' as const,
          amount: 5,
          balanceAfter: 5,
          description: 'New bonus',
          createdAt: '2026-01-03T00:00:00Z',
        },
      ],
      limit: 20,
      offset: 0,
      total: 1,
      hasMore: false,
    };
    vi.mocked(fetchAexTransactions).mockResolvedValue(mockResponse);

    const store = useAexStore();
    store.txRefreshing = false;
    await store.refreshTransactions();

    expect(store.transactions).toHaveLength(1);
    expect(store.txRefreshing).toBe(false);
    expect(fetchAexTransactions).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it('sets balance correctly', () => {
    const store = useAexStore();
    store.setBalance({ available: 100, totalEarned: 150, totalWithdrawn: 50 });

    expect(store.balance).toEqual({ available: 100, totalEarned: 150, totalWithdrawn: 50 });
  });
});
