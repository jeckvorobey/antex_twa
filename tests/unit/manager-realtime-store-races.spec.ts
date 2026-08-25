import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const { stream, updateViewing } = vi.hoisted(() => ({ stream: vi.fn(), updateViewing: vi.fn() }));
const { fetchChats, fetchOrders } = vi.hoisted(() => ({ fetchChats: vi.fn(), fetchOrders: vi.fn() }));

vi.mock('@services/manager-chat', () => ({
  openManagerRealtimeStream: stream,
  updateManagerRealtimeViewing: updateViewing,
  fetchManagerChats: fetchChats,
  fetchManagerOrders: fetchOrders,
}));

describe('manager SSE lifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    updateViewing.mockResolvedValue(undefined);
    fetchChats.mockResolvedValue({ items: [], total: 0, unreadTotal: 0 });
    fetchOrders.mockResolvedValue({ items: [] });
    stream.mockImplementation(async ({ onmessage }) => {
      onmessage({ data: JSON.stringify({ type: 'realtime.ready', payload: { unreadTotal: 0 } }) });
      return new Promise(() => undefined);
    });
  });

  afterEach(() => useManagerRealtimeStore().stop());

  it('opens SSE with an abortable manager connection and sends viewing after ready', async () => {
    const store = useManagerRealtimeStore();
    store.setViewing(42);
    store.start();
    await vi.waitFor(() => expect(stream).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(updateViewing).toHaveBeenCalledWith(expect.any(String), 42));
    expect(stream.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
  });

  it('aborts active SSE on stop', async () => {
    const store = useManagerRealtimeStore();
    store.start();
    await vi.waitFor(() => expect(stream).toHaveBeenCalledOnce());
    const { signal } = stream.mock.calls[0][0];
    store.stop();
    expect(signal.aborted).toBe(true);
  });
});
