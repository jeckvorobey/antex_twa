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
  let connectionGeneration = 0;
  let eventQueue: Promise<void> = Promise.resolve();

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

  /** Запускает heartbeat только для текущего manager workspace lifecycle. */
  function startHeartbeat(generation: number): void {
    clearHeartbeat();
    heartbeatTimer = window.setInterval(() => {
      if (generation !== connectionGeneration) {
        return;
      }
      send({ type: 'ping' });
    }, HEARTBEAT_MS);
  }

  /** Проверяет, что callback принадлежит активным generation и socket. */
  function isCurrentSocket(generation: number, source: WebSocket): boolean {
    return enabled && generation === connectionGeneration && socket === source;
  }

  /** Обрабатывает один envelope; ready REST snapshot остаётся source of truth. */
  async function handleMessage(
    raw: MessageEvent<string>,
    generation: number,
    source: WebSocket,
  ): Promise<void> {
    let event: ManagerRealtimeEnvelope;
    try {
      event = JSON.parse(raw.data) as ManagerRealtimeEnvelope;
    } catch {
      return;
    }

    if (!isCurrentSocket(generation, source)) {
      return;
    }
    const chatStore = useManagerChatStore();
    if (event.type === 'realtime.ready') {
      state.value = 'online';
      reconnectAttempt = 0;
      lastError.value = null;
      lastConnectedAt.value = new Date().toISOString();
      startHeartbeat(generation);
      sendViewing();
      await chatStore.reconcile();
      return;
    }
    if (!isCurrentSocket(generation, source)) {
      return;
    }
    await chatStore.handleRealtimeEvent(event);
  }

  /** Сериализует socket events, чтобы following event ждал ready reconciliation. */
  function queueSocketMessage(
    raw: MessageEvent<string>,
    generation: number,
    source: WebSocket,
  ): void {
    eventQueue = eventQueue
      .then(async () => {
        if (!isCurrentSocket(generation, source)) {
          return;
        }
        await handleMessage(raw, generation, source);
      })
      .catch((error: unknown) => {
        if (isCurrentSocket(generation, source)) {
          lastError.value = error instanceof Error ? error.message : 'Realtime недоступен';
        }
      });
  }

  /** Планирует reconnect в той же generation и не оживляет остановленный lifecycle. */
  function scheduleReconnect(generation: number): void {
    if (!enabled || generation !== connectionGeneration || reconnectTimer !== null) {
      return;
    }
    reconnectAttempt += 1;
    state.value = 'reconnecting';
    const delay = Math.min(500 * 2 ** Math.min(reconnectAttempt - 1, 5), MAX_RECONNECT_MS);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      if (enabled && generation === connectionGeneration) {
        void connect(generation);
      }
    }, delay);
  }

  /** Выпускает ticket и создаёт socket только для актуальной connection generation. */
  async function connect(generation: number): Promise<void> {
    if (
      !enabled ||
      generation !== connectionGeneration ||
      socket?.readyState === WebSocket.OPEN ||
      socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }
    clearReconnect();
    state.value = reconnectAttempt > 0 ? 'reconnecting' : 'connecting';
    try {
      const ticket = await issueManagerSocketTicket();
      if (!enabled || generation !== connectionGeneration) {
        return;
      }
      const nextSocket = new WebSocket(buildManagerSocketUrl(ticket.ticket));
      socket = nextSocket;
      nextSocket.onmessage = (event) => {
        queueSocketMessage(event, generation, nextSocket);
      };
      nextSocket.onerror = () => {
        if (isCurrentSocket(generation, nextSocket)) {
          lastError.value = 'Не удалось подключить realtime';
        }
      };
      nextSocket.onclose = () => {
        if (!isCurrentSocket(generation, nextSocket)) {
          return;
        }
        socket = null;
        clearHeartbeat();
        if (enabled && generation === connectionGeneration) {
          scheduleReconnect(generation);
        } else {
          state.value = 'offline';
        }
      };
    } catch (error) {
      if (!enabled || generation !== connectionGeneration) {
        return;
      }
      lastError.value = error instanceof Error ? error.message : 'Realtime недоступен';
      scheduleReconnect(generation);
    }
  }

  /** Открывает единственный transport lifecycle для mounted ManagerLayout. */
  function start(): void {
    if (enabled) {
      return;
    }
    enabled = true;
    reconnectAttempt = 0;
    const generation = ++connectionGeneration;
    eventQueue = Promise.resolve();
    void connect(generation);
  }

  /** Инвалидирует ticket, socket callbacks, event queue и timers текущей generation. */
  function stop(): void {
    enabled = false;
    connectionGeneration += 1;
    eventQueue = Promise.resolve();
    clearHeartbeat();
    clearReconnect();
    const currentSocket = socket;
    socket = null;
    if (currentSocket) {
      currentSocket.onmessage = null;
      currentSocket.onerror = null;
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
