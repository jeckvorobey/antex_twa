import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  openManagerRealtimeStream,
  updateManagerRealtimeViewing,
} from '@services/manager-chat';
import type { ManagerRealtimeEnvelope, ManagerRealtimeState } from '@types/manager-chat';

import { useManagerChatStore } from './manager-chat.store';

const MAX_RECONNECT_MS = 15_000;

export const useManagerRealtimeStore = defineStore('manager-realtime', () => {
  const state = ref<ManagerRealtimeState>('idle');
  const lastConnectedAt = ref<string | null>(null);
  const lastError = ref<string | null>(null);
  const currentConversationId = ref<number | null>(null);
  const online = computed(() => state.value === 'online');

  let enabled = false;
  let controller: AbortController | null = null;
  let reconnectTimer: number | null = null;
  let reconnectAttempt = 0;
  let connectionGeneration = 0;
  let eventQueue: Promise<void> = Promise.resolve();
  let reconciliationController: AbortController | null = null;
  let connectionId: string | null = null;

  function clearReconnect(): void {
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function cancelReconciliation(): void {
    reconciliationController?.abort();
    reconciliationController = null;
  }

  function isCurrent(generation: number, source: AbortController): boolean {
    return enabled && generation === connectionGeneration && controller === source;
  }

  function sendViewing(): void {
    if (state.value === 'online' && connectionId) {
      void updateManagerRealtimeViewing(connectionId, currentConversationId.value).catch(() => undefined);
    }
  }

  async function handleMessage(raw: string, generation: number, source: AbortController): Promise<void> {
    let event: ManagerRealtimeEnvelope;
    try {
      event = JSON.parse(raw) as ManagerRealtimeEnvelope;
    } catch {
      return;
    }
    if (!isCurrent(generation, source)) return;
    const chatStore = useManagerChatStore();
    if (event.type === 'manager.refresh') {
      if (!isCurrent(generation, source)) return;
      cancelReconciliation();
      const nextController = new AbortController();
      reconciliationController = nextController;
      void chatStore.reconcile({ signal: nextController.signal }).finally(() => {
        if (reconciliationController === nextController) reconciliationController = null;
      });
      return;
    }
    if (event.type === 'realtime.ready') {
      state.value = 'online';
      reconnectAttempt = 0;
      lastError.value = null;
      lastConnectedAt.value = new Date().toISOString();
      sendViewing();
      cancelReconciliation();
      const nextController = new AbortController();
      reconciliationController = nextController;
      try {
        await chatStore.reconcile({ signal: nextController.signal });
      } finally {
        if (reconciliationController === nextController) reconciliationController = null;
      }
      return;
    }
    if (isCurrent(generation, source)) await chatStore.handleRealtimeEvent(event);
  }

  function scheduleReconnect(generation: number): void {
    if (!enabled || generation !== connectionGeneration || reconnectTimer !== null) return;
    reconnectAttempt += 1;
    state.value = 'reconnecting';
    const delay = Math.min(500 * 2 ** Math.min(reconnectAttempt - 1, 5), MAX_RECONNECT_MS);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      void connect(generation);
    }, delay);
  }

  async function connect(generation: number): Promise<void> {
    if (!enabled || generation !== connectionGeneration || controller) return;
    clearReconnect();
    state.value = reconnectAttempt ? 'reconnecting' : 'connecting';
    const nextController = new AbortController();
    controller = nextController;
    connectionId = crypto.randomUUID();
    try {
      await openManagerRealtimeStream({
        signal: nextController.signal,
        connectionId,
        onmessage: (message) => {
          eventQueue = eventQueue.then(() => handleMessage(message.data, generation, nextController));
        },
      });
      if (isCurrent(generation, nextController)) scheduleReconnect(generation);
    } catch (error) {
      if (isCurrent(generation, nextController) && !nextController.signal.aborted) {
        lastError.value = error instanceof Error ? error.message : 'Realtime недоступен';
        scheduleReconnect(generation);
      }
    } finally {
      if (controller === nextController) controller = null;
    }
  }

  function start(): void {
    if (enabled) return;
    enabled = true;
    reconnectAttempt = 0;
    eventQueue = Promise.resolve();
    void connect(++connectionGeneration);
  }

  function stop(): void {
    enabled = false;
    connectionGeneration += 1;
    eventQueue = Promise.resolve();
    cancelReconciliation();
    clearReconnect();
    controller?.abort();
    controller = null;
    connectionId = null;
    state.value = 'offline';
  }

  function setViewing(conversationId: number | null): void {
    currentConversationId.value = conversationId;
    sendViewing();
  }

  return { state, online, lastConnectedAt, lastError, currentConversationId, start, stop, setViewing };
});
