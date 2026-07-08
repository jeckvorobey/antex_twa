import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  fetchAexWallet: vi.fn(),
  applyReferralCode: vi.fn(),
  transferAex: vi.fn(),
}));

import { fetchAexWallet, transferAex } from '@services/api/miniapp.service';
import { useAexStore } from '@stores/aex.store';

// ── Source-level checks ─────────────────────────────────────────────

const servicePath = resolve(process.cwd(), 'src/services/api/miniapp.service.ts');
const serviceSource = readFileSync(servicePath, 'utf8');

describe('transferAex API function (source)', () => {
  it('exports transferAex function', () => {
    expect(serviceSource).toContain('export async function transferAex');
  });

  it('calls POST /api/miniapp/aex/transfer', () => {
    expect(serviceSource).toContain('/api/miniapp/aex/transfer');
  });

  it('accepts orderId and amount params', () => {
    expect(serviceSource).toContain('orderId');
    expect(serviceSource).toContain('amount');
  });
});

// ── Store-level checks ─────────────────────────────────────────────

describe('AEX store transfer action', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('has sellAex action', () => {
    const store = useAexStore();
    expect(typeof store.sellAex).toBe('function');
  });

  it('calls transferAex with orderId and amount', async () => {
    vi.mocked(transferAex).mockResolvedValue({ success: true });

    const store = useAexStore();
    await store.sellAex(42, 10);

    expect(transferAex).toHaveBeenCalledWith({ orderId: 42, amount: 10 });
  });

  it('sets sellLoading during transfer', async () => {
    let resolveTransfer!: (value: { success: boolean }) => void;
    vi.mocked(transferAex).mockImplementation(
      () => new Promise((resolve) => { resolveTransfer = resolve; }),
    );

    const store = useAexStore();
    expect(store.sellLoading).toBe(false);

    const promise = store.sellAex(1, 5);
    expect(store.sellLoading).toBe(true);

    resolveTransfer({ success: true });
    await promise;

    expect(store.sellLoading).toBe(false);
  });

  it('reloads balance from backend after successful transfer', async () => {
    vi.mocked(transferAex).mockResolvedValue({ success: true });
    vi.mocked(fetchAexWallet).mockResolvedValue({
      id: 1,
      user_id: 10,
      balance_available: '70',
      balance_reserved: '30',
      balance_total: '100',
      is_exchange_available: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    const store = useAexStore();
    store.balance = { available: 100, reserved: 0, totalEarned: 150, totalWithdrawn: 50 };
    await store.sellAex(1, 30);

    expect(fetchAexWallet).toHaveBeenCalled();
    expect(store.balance?.available).toBe(70);
    expect(store.balance?.reserved).toBe(30);
  });

  it('uses backend wallet state instead of client-side clamping', async () => {
    vi.mocked(transferAex).mockResolvedValue({ success: true });
    vi.mocked(fetchAexWallet).mockResolvedValue({
      id: 1,
      user_id: 10,
      balance_available: '0',
      balance_reserved: '10',
      balance_total: '10',
      is_exchange_available: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    const store = useAexStore();
    store.balance = { available: 10, reserved: 0, totalEarned: 150, totalWithdrawn: 50 };
    await store.sellAex(1, 30);

    expect(store.balance?.available).toBe(0);
    expect(store.balance?.reserved).toBe(10);
  });

  it('returns error on failure without modifying balance', async () => {
    vi.mocked(transferAex).mockRejectedValue(new Error('insufficient'));

    const store = useAexStore();
    store.balance = { available: 100, reserved: 0, totalEarned: 150, totalWithdrawn: 50 };

    const result = await store.sellAex(1, 30);

    expect(result.success).toBe(false);
    expect(store.balance?.available).toBe(100);
    expect(store.sellLoading).toBe(false);
  });
});
