import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@boot/axios', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '@boot/axios';
import { cancelOrder, transferAex } from '@services/api/miniapp.service';

describe('transferAex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the selected order and amount to the backend transfer route', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ok: true } });

    const result = await transferAex({ orderId: 42, amount: 10 });

    expect(api.post).toHaveBeenCalledWith('/api/aex/transfer', {
      orderId: 42,
      amount: 10,
    });
    expect(result).toEqual({ ok: true });
  });
});

describe('cancelOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to the user order cancel route', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 17, status: 4 } });

    const result = await cancelOrder(17);

    expect(api.post).toHaveBeenCalledWith('/api/orders/17/cancel');
    expect(result).toEqual({ id: 17, status: 4 });
  });
});
