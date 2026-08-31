import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useManagerChatStore } from '@stores/manager-chat.store';

describe('manager chat realtime reducer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('updates global unread counter from realtime event', async () => {
    const store = useManagerChatStore();

    await store.handleRealtimeEvent({
      type: 'chat.unread.updated',
      payload: { conversationId: 10, unreadCount: 3, unreadTotal: 7 },
    });

    expect(store.unreadTotal).toBe(7);
  });

  it('accepts realtime ready counter without polling', async () => {
    const store = useManagerChatStore();

    await store.handleRealtimeEvent({
      type: 'realtime.ready',
      payload: { unreadTotal: 4 },
    });

    expect(store.unreadTotal).toBe(4);
  });
});
