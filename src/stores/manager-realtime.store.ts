import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { buildManagerSocketUrl, issueManagerSocketTicket } from '@services/manager-chat';
import type { ManagerRealtimeEnvelope, ManagerRealtimeState } from '@types/manager-chat';

import { useManagerChatStore } from './manager-chat.store';

const HEARTBEAT_MS = 20_000;
const MAX_RECONNECT_MS = 15_000;

export const useManagerRealtimeStore = defineStore('manager-realtime', () => {
  const state = ref<ManagerRealtimeState>('idle');
  const lastConnectedAt = ref<string | null>(null);
  const lastError = ref<string | null>(null);
  const currentConversationId = ref<number | null>(null);

  let enabled = false;
  let socket: WebSocket | null = null;
  let heartbeatTimer: number | null = null;
  let reconnectTimer: number | null = null;
  let reconnectAttempt = 0;

  const online = computed(() => state.value === 'online');

  function clearHeartbeat(): void {
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function clearReconnect(): void {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function send(payload: Record<string, unknown>): void {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }

  function sendViewing(): void {
    send({ type: 'viewing', conversationId: currentConversationId.value });
  }

  function startHeartbeat(): void {
    clearHeartbeat();
    heartbeatTimer = window.setInterval(() => {
      send({ type: 'ping' });
    }, HEARTBEAT_MS);
  }

  async function handleMessage(raw: MessageEvent<string>): Promise<void> {
    let event: ManagerRealtimeEnvelope;
    try {
      event = JSON.parse(raw.data) as ManagerRealtimeEnvelope;
    } catch {
      return;
    }

    const chatStore = useManagerChatStore();
    if (event.type === 'realtime.ready') {
      state.value = 'online';
      reconnectAttempt = 0;
      lastError.value = null;
      lastConnectedAt.value = new Date().toISOString();
      startHeartbeat();
      sendViewing();
      await chatStore.reconcile();
    }
    await chatStore.handleRealtimeEvent(event);
  }

  function scheduleReconnect(): void {
    if (!enabled || reconnectTimer !== null) {
      return;
    }
    reconnectAttempt += 1;
    state.value = 'reconnecting';
    const delay = Math.min(500 * 2 ** Math.min(reconnectAttempt - 1, 5), MAX_RECONNECT_MS);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, delay);
  }

  async function connect(): Promise<void> {
    if (!enabled || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
      return;
    }
    clearReconnect();
    state.value = reconnectAttempt > 0 ? 'reconnecting' : 'connecting';
    try {
      const ticket = await issueManagerSocketTicket();
      if (!enabled) {
        return;
      }
      const nextSocket = new WebSocket(buildManagerSocketUrl(ticket.ticket));
      socket = nextSocket;
      nextSocket.onmessage = (event) => {
        void handleMessage(event);
      };
      nextSocket.onerror = () => {
        lastError.value = 'Не удалось подключить realtime';
      };
      nextSocket.onclose = () => {
        if (socket === nextSocket) {
          socket = null;
        }
        clearHeartbeat();
        if (enabled) {
          scheduleReconnect();
        } else {
          state.value = 'offline';
        }
      };
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Realtime недоступен';
      scheduleReconnect();
    }
  }

  function start(): void {
    if (enabled) {
      return;
    }
    enabled = true;
    reconnectAttempt = 0;
    void connect();
  }

  function stop(): void {
    enabled = false;
    clearHeartbeat();
    clearReconnect();
    const currentSocket = socket;
    socket = null;
    if (currentSocket) {
      currentSocket.onclose = null;
      currentSocket.close(1000, 'manager workspace closed');
    }
    state.value = 'offline';
  }

  function setViewing(conversationId: number | null): void {
    currentConversationId.value = conversationId;
    sendViewing();
  }

  return {
    state,
    online,
    lastConnectedAt,
    lastError,
    currentConversationId,
    start,
    stop,
    setViewing,
  };
});
