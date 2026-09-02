import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { QBtn, QInput, QIcon, QTooltip, QSpinner, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatComposer from '@components/manager/ChatComposer.vue';
import ManagerChatPage from '@pages/manager/ManagerChatPage.vue';
import {
  fetchManagerChat,
  fetchManagerChatMessages,
  sendManagerChatMessage,
  sendManagerChatAttachment,
} from '@services/manager-chat';
import type { ManagerChatMessage, ManagerConversation } from '@types/manager-chat';
import ru from '@i18n/ru';

const { harness, notify } = vi.hoisted(() => ({
  harness: {} as { route?: { params: { conversationId: string } } },
  notify: vi.fn(),
}));
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  harness.route = reactive({ params: { conversationId: '7' } });
  return { useRoute: () => harness.route, useRouter: () => ({ push: vi.fn() }) };
});
vi.mock('@/composables/useAntexNotify', () => ({ useAntexNotify: () => ({ notify }) }));
vi.mock('@stores/manager-realtime.store', () => ({
  useManagerRealtimeStore: () => ({ state: 'connected', setViewing: vi.fn() }),
}));
vi.mock('@services/manager-chat', () => ({
  closeManagerChat: vi.fn(),
  ensureManagerOrderChat: vi.fn(),
  fetchManagerChat: vi.fn(),
  fetchManagerChatMessages: vi.fn(),
  fetchManagerChats: vi.fn(),
  fetchManagerOrder: vi.fn(),
  fetchManagerOrders: vi.fn(),
  markManagerChatRead: vi.fn(),
  sendManagerChatAttachment: vi.fn(),
  sendManagerChatMessage: vi.fn(),
  updateManagerOrderStatus: vi.fn(),
  forwardManagerChatMessage: vi.fn(),
}));

/** Подменяет только аппаратную запись; composer, page и store остаются настоящими. */
class RecorderMock {
  static isTypeSupported = () => true;
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  /** Запускает тестовую запись. */
  start() {
    this.state = 'recording';
  }
  /** Выдаёт готовые bytes и событие завершения. */
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['voice'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

/** Создаёт диалог нужного маршрута. */
function conversation(id: number): ManagerConversation {
  return {
    id,
    status: 'open',
    unreadCount: 0,
    lastMessageAt: null,
    lastMessage: null,
    latestOrder: null,
    user: {
      id,
      telegramId: id,
      username: null,
      firstName: 'Клиент',
      lastName: null,
      photoUrl: null,
    },
  };
}

/** Создаёт API-сообщение с заданным состоянием доставки. */
function message(status = 'sent', conversationId = 7): ManagerChatMessage {
  return {
    id: 10,
    conversationId,
    direction: 'outbound',
    messageType: 'text',
    text: 'Исходное сообщение',
    caption: null,
    deliveryStatus: status,
    telegramMessageId: 100,
    replyToMessageId: null,
    edited: false,
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
    attachments: [],
  };
}

const wrappers: VueWrapper[] = [];
/** Монтирует страницу с реальным composer/store; несвязанные компоненты изолированы. */
async function setup() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(ManagerChatPage, {
    global: {
      plugins: [pinia, Quasar, createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
      components: { QBtn, QInput, QIcon, QTooltip, QSpinner },
      stubs: {
        ManagerPageHeader: true,
        ConnectionStatePill: true,
        OrderCard: true,
        ChatBubble: true,
        ChatDateDivider: true,
        AntexEmptyState: true,
        ChatForwardDialog: true,
        QPage: { template: '<main><slot /></main>' },
        QDialog: { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' },
        QCard: true,
        QCardSection: true,
        QCardActions: true,
      },
      directives: { 'close-popup': {} },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}

/** Выбирает исходное сообщение для ответа через событие bubble. */
async function selectReply(wrapper: VueWrapper) {
  wrapper.findComponent({ name: 'ChatBubble' }).vm.$emit('reply', message('received'));
  await flushPromises();
}

/** Создаёт preview через доступные кнопки рекордера. */
async function recordPreview(wrapper: VueWrapper) {
  await wrapper.get('[data-testid="record"]').trigger('click', { detail: 0 });
  await flushPromises();
  await wrapper.get('[data-testid="stop-recording"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('audio').attributes('src')).toBe('blob:test-recording');
}

describe('жизненный цикл отправки страницы чата', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    harness.route!.params.conversationId = '7';
    vi.mocked(fetchManagerChat).mockImplementation(async (id) => conversation(id));
    vi.mocked(fetchManagerChatMessages).mockImplementation(async (id) => ({
      items: [message('received', id)],
      hasMore: false,
    }));
    vi.stubGlobal('MediaRecorder', RecorderMock);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
      },
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-recording');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });
  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(['failed', 'pending'])(
    'сохраняет текст и reply при %s, очищает после sent',
    async (status) => {
      vi.mocked(sendManagerChatMessage)
        .mockResolvedValueOnce(message(status))
        .mockResolvedValueOnce(message());
      const wrapper = await setup();
      await selectReply(wrapper);
      await wrapper.get('textarea').setValue('Черновик');
      await wrapper.get('[aria-label="Отправить сообщение"]').trigger('click');
      await flushPromises();
      expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Черновик');
      expect(wrapper.getComponent(ChatComposer).props('replyLabel')).toBe('Исходное сообщение');
      expect(notify).toHaveBeenCalledWith('negative', expect.any(String));
      await wrapper.get('[aria-label="Отправить сообщение"]').trigger('click');
      await flushPromises();
      expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('');
      expect(wrapper.getComponent(ChatComposer).props('replyLabel')).toBeUndefined();
      const calls = vi.mocked(sendManagerChatMessage).mock.calls;
      expect(calls[1]![1].clientRequestId).toBe(calls[0]![1].clientRequestId);
    },
  );

  it.each(['failed', 'pending'])(
    'сохраняет запись и reply при %s, очищает после sent',
    async (status) => {
      vi.mocked(sendManagerChatAttachment)
        .mockResolvedValueOnce(message(status))
        .mockResolvedValueOnce(message());
      const wrapper = await setup();
      await selectReply(wrapper);
      await recordPreview(wrapper);
      await wrapper.get('[data-testid="send-recording"]').trigger('click');
      await flushPromises();
      expect(wrapper.get('audio').attributes('src')).toBe('blob:test-recording');
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
      expect(wrapper.getComponent(ChatComposer).props('replyLabel')).toBe('Исходное сообщение');
      await wrapper.get('[data-testid="send-recording"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('audio').exists()).toBe(false);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-recording');
      const calls = vi.mocked(sendManagerChatAttachment).mock.calls;
      expect(calls[1]![1]).toBe(calls[0]![1]);
      expect(calls[1]![2]).toBe(calls[0]![2]);
      expect(calls[0]![3]).toEqual({ kind: 'voice', replyToMessageId: 10 });
    },
  );

  it('поздний sent старого диалога не очищает совпадающий текст и reply нового', async () => {
    let resolve!: (value: ManagerChatMessage) => void;
    vi.mocked(sendManagerChatMessage).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const wrapper = await setup();
    await wrapper.get('textarea').setValue('Одинаковый черновик');
    await wrapper.get('[aria-label="Отправить сообщение"]').trigger('click');
    harness.route!.params.conversationId = '8';
    await flushPromises();
    wrapper.getComponent(ChatComposer).vm.$emit('update:modelValue', 'Одинаковый черновик');
    await selectReply(wrapper);
    resolve(message());
    await flushPromises();
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe(
      'Одинаковый черновик',
    );
    expect(wrapper.getComponent(ChatComposer).props('replyLabel')).toBe('Исходное сообщение');
    expect(notify).not.toHaveBeenCalled();
  });

  it('поздняя доставка записи не сбрасывает новый composer после смены маршрута', async () => {
    let resolve!: (value: ManagerChatMessage) => void;
    vi.mocked(sendManagerChatAttachment).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const wrapper = await setup();
    await recordPreview(wrapper);
    await wrapper.get('[data-testid="send-recording"]').trigger('click');
    harness.route!.params.conversationId = '8';
    await flushPromises();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    const newComposer = wrapper.getComponent(ChatComposer);
    const reset = vi.spyOn(newComposer.vm, 'resetRecording');
    newComposer.vm.$emit('update:modelValue', 'Новый черновик');
    await selectReply(wrapper);
    resolve(message());
    await flushPromises();
    expect(reset).not.toHaveBeenCalled();
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Новый черновик');
    expect(newComposer.props('replyLabel')).toBe('Исходное сообщение');
    expect(notify).not.toHaveBeenCalled();
  });
});
