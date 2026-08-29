import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import {
  QAvatar,
  QBtn,
  QCard,
  QIcon,
  QImg,
  QInput,
  QSkeleton,
  QSpinner,
  QSpinnerDots,
  QTooltip,
  Quasar,
} from 'quasar';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChatComposer from '@components/manager/ChatComposer.vue';
import ChatAttachmentCard from '@components/manager/ChatAttachmentCard.vue';
import ChatBubble from '@components/manager/ChatBubble.vue';
import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import OrderStatusChip from '@components/manager/OrderStatusChip.vue';
import ru from '@i18n/ru';
import ManagerChatPage from '@pages/manager/ManagerChatPage.vue';
import ManagerChatsPage from '@pages/manager/ManagerChatsPage.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const { routerPush, routeHarness } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routeHarness: {} as { route?: { params: { conversationId: string }; meta: Record<string, unknown> } },
}));

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  routeHarness.route = reactive({ params: { conversationId: '7' }, meta: {} });
  return {
    useRouter: () => ({ push: routerPush }),
    useRoute: () => routeHarness.route,
  };
});

vi.mock('@services/manager-chat', () => ({
  closeManagerChat: vi.fn(),
  ensureManagerOrderChat: vi.fn(),
  fetchManagerAttachment: vi.fn(),
  fetchManagerChat: vi.fn(),
  fetchManagerChatMessages: vi.fn(),
  fetchManagerChats: vi.fn(),
  fetchManagerOrder: vi.fn(),
  fetchManagerOrders: vi.fn(),
  markManagerChatRead: vi.fn(),
  sendManagerChatAttachment: vi.fn(),
  sendManagerChatMessage: vi.fn(),
  updateManagerOrderStatus: vi.fn(),
}));

import {
  fetchManagerAttachment,
  fetchManagerChat,
  fetchManagerChatMessages,
  fetchManagerChats,
} from '@services/manager-chat';
import type { ManagerChatMessage } from '@types/manager-chat';

function makeOutboundMessage(deliveryStatus: string): ManagerChatMessage {
  return {
    id: 1,
    conversationId: 7,
    direction: 'outbound',
    messageType: 'text',
    text: 'Проверка',
    caption: null,
    deliveryStatus,
    telegramMessageId: null,
    replyToMessageId: null,
    edited: false,
    createdAt: '2026-08-29T07:00:00+03:00',
    updatedAt: '2026-08-29T07:00:00+03:00',
    attachments: [],
  };
}

function globalOptions(pinia = createPinia()) {
  return {
    plugins: [
      pinia,
      Quasar,
      createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
    ],
    components: {
      QAvatar,
      QBtn,
      QCard,
      QIcon,
      QImg,
      QInput,
      QSkeleton,
      QSpinner,
      QSpinnerDots,
      QTooltip,
    },
    stubs: {
      ManagerPageHeader: true,
      ConnectionStatePill: true,
      ConversationListItem: true,
      OrderCard: true,
      ChatBubble: true,
      ChatDateDivider: true,
      QPage: { template: '<main><slot /></main>' },
    },
  };
}

describe('manager localized states', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    routeHarness.route!.params.conversationId = '7';
  });

  it('reloads the conversation when Vue reuses the page for another route id', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.mocked(fetchManagerChat).mockResolvedValue({
      id: 7, status: 'open', unreadCount: 0, lastMessageAt: null,
      user: { id: 41, telegramId: 900_041, username: null, firstName: null, lastName: null, photoUrl: null },
      lastMessage: null, latestOrder: null,
    });
    vi.mocked(fetchManagerChatMessages).mockResolvedValue({ items: [], hasMore: false });

    mount(ManagerChatPage, { global: globalOptions(pinia) });
    await vi.waitFor(() => expect(fetchManagerChat).toHaveBeenCalledWith(7, expect.anything()));

    routeHarness.route!.params.conversationId = '8';
    await vi.waitFor(() => expect(fetchManagerChat).toHaveBeenCalledWith(8, expect.anything()));
  });

  it('tracks a failed chat list separately from an empty successful result', async () => {
    const store = useManagerChatStore();
    vi.mocked(fetchManagerChats).mockRejectedValueOnce(new Error('network unavailable'));

    await expect(store.loadChats()).rejects.toThrow('network unavailable');
    expect(store.chatsError).toBe('load_failed');

    vi.mocked(fetchManagerChats).mockResolvedValueOnce({ items: [], total: 0, unreadTotal: 0 });
    await store.loadChats();
    expect(store.chatsError).toBeNull();
  });

  it('shows the loading state while the chat list request is pending', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    let resolveRequest!: (value: { items: []; total: number; unreadTotal: number }) => void;
    vi.mocked(fetchManagerChats).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const wrapper = mount(ManagerChatsPage, { global: globalOptions(pinia) });
    await vi.waitFor(() => expect(fetchManagerChats).toHaveBeenCalledTimes(1));
    expect(wrapper.find('.q-spinner').exists()).toBe(true);

    resolveRequest({ items: [], total: 0, unreadTotal: 0 });
    await flushPromises();
    expect(wrapper.text()).toContain('Новых диалогов нет');
  });

  it('shows a localized retryable chat-list error and then the empty state', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.mocked(fetchManagerChats)
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ items: [], total: 0, unreadTotal: 0 });

    const wrapper = mount(ManagerChatsPage, { global: globalOptions(pinia) });
    await vi.waitFor(() => expect(fetchManagerChats).toHaveBeenCalledTimes(1));
    await flushPromises();
    expect(wrapper.text()).toContain('Не удалось загрузить чаты');
    expect(wrapper.text()).not.toContain('Новых диалогов нет');

    await wrapper.get('.antex-empty-state__action').trigger('click');
    await vi.waitFor(() => expect(fetchManagerChats).toHaveBeenCalledTimes(2));
    await flushPromises();
    expect(wrapper.text()).toContain('Новых диалогов нет');
  });

  it('keeps a failed conversation route visible and retryable', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.mocked(fetchManagerChat)
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({
        id: 7,
        status: 'open',
        unreadCount: 0,
        lastMessageAt: null,
        user: {
          id: 41,
          telegramId: 900_041,
          username: 'client',
          firstName: 'Сергей',
          lastName: 'Иванов',
          photoUrl: null,
        },
        lastMessage: null,
        latestOrder: null,
      });
    vi.mocked(fetchManagerChatMessages).mockResolvedValue({ items: [], hasMore: false });

    const wrapper = mount(ManagerChatPage, { global: globalOptions(pinia) });
    await vi.waitFor(() => expect(fetchManagerChat).toHaveBeenCalledTimes(1));
    await flushPromises();
    expect(wrapper.text()).toContain('Не удалось открыть диалог');
    expect(routerPush).not.toHaveBeenCalled();

    await wrapper.get('button').trigger('click');
    await vi.waitFor(() => expect(fetchManagerChat).toHaveBeenCalledTimes(2));
    await flushPromises();
    expect(wrapper.text()).toContain('История пока пустая');
  });

  it('localizes reconnecting, offline, status and compact composer controls', async () => {
    const options = globalOptions();
    const connection = mount(ConnectionStatePill, {
      props: { state: 'reconnecting' },
      global: options,
    });
    expect(connection.text()).toBe('Переподключение');
    await connection.setProps({ state: 'offline' });
    expect(connection.text()).toBe('Нет соединения');

    const status = mount(OrderStatusChip, { props: { status: 2 }, global: options });
    expect(status.text()).toBe('В работе');
    await status.setProps({ status: 99 });
    expect(status.text()).toBe('Статус 99');

    const composer = mount(ChatComposer, { global: options });
    expect(composer.get('textarea').attributes('placeholder')).toBe('Сообщение…');
    expect(composer.get('[aria-label="Прикрепить файл"]').exists()).toBe(true);
    expect(composer.get('[aria-label="Отправить сообщение"]').exists()).toBe(true);
  });

  it('keeps the message draft until the parent confirms a successful send', async () => {
    const composer = mount(ChatComposer, { global: globalOptions() });
    await composer.get('textarea').setValue('Важный черновик');

    await composer.get('[aria-label="Отправить сообщение"]').trigger('click');

    expect(composer.emitted('send')).toEqual([['Важный черновик']]);
    expect((composer.get('textarea').element as HTMLTextAreaElement).value).toBe('Важный черновик');
  });

  it('announces pending and sent delivery states to assistive technology', async () => {
    const options = globalOptions();
    const bubble = mount(ChatBubble, {
      props: { message: makeOutboundMessage('pending') },
      global: options,
    });

    expect(bubble.get('.manager-chat-bubble__delivery').attributes('aria-label')).toBe(
      'Отправляется',
    );

    await bubble.setProps({ message: makeOutboundMessage('sent') });
    expect(bubble.get('.manager-chat-bubble__delivery').attributes('aria-label')).toBe(
      'Отправлено',
    );

    await bubble.setProps({ message: makeOutboundMessage('failed') });
    expect(bubble.get('.manager-chat-bubble__delivery').attributes('aria-label')).toBeUndefined();
    expect(bubble.findAll('.manager-chat-bubble__failed')).toHaveLength(1);
    expect(bubble.get('.manager-chat-bubble__failed').text()).toBe('Не доставлено');
  });

  it('gives the voice attachment player a localized accessible name', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:voice-message'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(fetchManagerAttachment).mockResolvedValue(new Blob(['voice']));

    const attachment = mount(ChatAttachmentCard, {
      props: {
        attachment: {
          id: 11,
          kind: 'voice',
          fileId: 'voice-id',
          fileUniqueId: null,
          filename: null,
          mimeType: 'audio/ogg',
          size: 5,
        },
      },
      global: globalOptions(),
    });
    await flushPromises();

    const player = attachment.get('audio[controls]');
    expect(player.attributes('aria-label')).toBe('Голосовое сообщение');
  });
});
