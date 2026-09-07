import { flushPromises, mount } from '@vue/test-utils';
import {
  QBtn,
  QInput,
  QItem,
  QItemSection,
  QList,
  QCard,
  QCardSection,
  QCardActions,
  QIcon,
  QSpinner,
  Quasar,
} from 'quasar';
import { createI18n } from 'vue-i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatForwardDialog from '@components/manager/ChatForwardDialog.vue';
import { fetchManagerChats } from '@services/manager-chat';
import type { ManagerChatListResponse, ManagerConversation } from '@types/manager-chat';
import ru from '@i18n/ru';

vi.mock('@services/manager-chat', () => ({ fetchManagerChats: vi.fn() }));

/** Управляет порядком сетевых ответов независимо от AbortSignal. */
function deferred() {
  let resolve!: (value: ManagerChatListResponse) => void;
  const promise = new Promise<ManagerChatListResponse>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** Создаёт получателя с отличающимися id пользователя и диалога. */
function conversation(id: number, firstName: string): ManagerConversation {
  return {
    id,
    status: 'open',
    unreadCount: 0,
    lastMessageAt: null,
    lastMessage: null,
    latestOrder: null,
    user: {
      id: id + 1000,
      telegramId: id + 9000,
      username: null,
      firstName,
      lastName: null,
      photoUrl: null,
    },
  };
}

/** Возвращает страницу получателей. */
function page(...items: ManagerConversation[]): ManagerChatListResponse {
  return { items, total: items.length, unreadTotal: 0 };
}

/** Монтирует настоящий диалог с Quasar controls без портала и анимации QDialog. */
function setup() {
  return mount(ChatForwardDialog, {
    props: { modelValue: true },
    global: {
      plugins: [Quasar, createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
      components: {
        QBtn,
        QInput,
        QItem,
        QItemSection,
        QList,
        QCard,
        QCardSection,
        QCardActions,
        QIcon,
        QSpinner,
      },
      stubs: {
        QDialog: { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' },
      },
      directives: { 'close-popup': {} },
    },
  });
}

describe('выбор получателя пересылки', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('передаёт id выбранного диалога только после явного подтверждения', async () => {
    vi.mocked(fetchManagerChats).mockResolvedValue(
      page(conversation(7, 'Анна'), conversation(8, 'Борис')),
    );
    const wrapper = setup();
    await flushPromises();
    const confirm = wrapper
      .findAllComponents(QBtn)
      .find((button) => button.props('label') === 'Переслать')!;
    expect(confirm.props('disable')).toBe(true);
    await wrapper.findAll('[role="option"]')[1]!.trigger('click');
    expect(wrapper.emitted('forward')).toBeUndefined();
    expect(wrapper.get('[aria-selected="true"]').getComponent(QItemSection).text()).toBe('Борис');
    expect(wrapper.text()).toContain('Переслать в диалог «Борис»?');
    expect(confirm.props('disable')).toBe(false);
    await confirm.trigger('click');
    expect(wrapper.emitted('forward')).toEqual([[8]]);
    wrapper.unmount();
  });

  it('устаревший поиск не заменяет актуальных получателей и сбрасывает прежний выбор', async () => {
    const oldSearch = deferred();
    const newSearch = deferred();
    vi.mocked(fetchManagerChats)
      .mockResolvedValueOnce(page(conversation(7, 'Анна')))
      .mockReturnValueOnce(oldSearch.promise)
      .mockReturnValueOnce(newSearch.promise);
    const wrapper = setup();
    await flushPromises();
    await wrapper.get('[role="option"]').trigger('click');
    wrapper.getComponent(QInput).vm.$emit('update:modelValue', 'Старый поиск');
    await flushPromises();
    expect(wrapper.find('[aria-selected="true"]').exists()).toBe(false);
    wrapper.getComponent(QInput).vm.$emit('update:modelValue', 'Борис');
    await flushPromises();
    expect(vi.mocked(fetchManagerChats).mock.calls[1]![1]?.signal?.aborted).toBe(true);
    newSearch.resolve(page(conversation(8, 'Борис')));
    await flushPromises();
    oldSearch.resolve(page(conversation(9, 'Устаревший клиент')));
    await flushPromises();
    expect(wrapper.findAll('[role="option"]').map((item) => item.text())).toEqual(['Борис']);
    const confirm = wrapper
      .findAllComponents(QBtn)
      .find((button) => button.props('label') === 'Переслать')!;
    expect(confirm.props('disable')).toBe(true);
    wrapper.unmount();
  });

  it('закрытие отменяет запрос; поздний ответ не появляется после повторного открытия', async () => {
    const oldSearch = deferred();
    const reopened = deferred();
    vi.mocked(fetchManagerChats)
      .mockReturnValueOnce(oldSearch.promise)
      .mockReturnValueOnce(reopened.promise);
    const wrapper = setup();
    await wrapper.setProps({ modelValue: false });
    expect(vi.mocked(fetchManagerChats).mock.calls[0]![1]?.signal?.aborted).toBe(true);
    await wrapper.setProps({ modelValue: true });
    reopened.resolve(page(conversation(8, 'Борис')));
    await flushPromises();
    oldSearch.resolve(page(conversation(7, 'Анна')));
    await flushPromises();
    expect(wrapper.findAll('[role="option"]').map((item) => item.text())).toEqual(['Борис']);
    expect(wrapper.emitted('forward')).toBeUndefined();
    wrapper.unmount();
  });

  it('добавляет следующую страницу, сохраняя явно выбранного получателя', async () => {
    vi.mocked(fetchManagerChats)
      .mockResolvedValueOnce({ ...page(conversation(7, 'Анна')), total: 2 })
      .mockResolvedValueOnce({ ...page(conversation(8, 'Борис')), total: 2 });
    const wrapper = setup();
    await flushPromises();
    await wrapper.get('[role="option"]').trigger('click');
    const more = wrapper
      .findAllComponents(QBtn)
      .find((button) => button.props('label') === ru.manager.chat.forward.more)!;
    await more.trigger('click');
    await flushPromises();
    expect(fetchManagerChats).toHaveBeenLastCalledWith(
      { query: undefined, limit: 50, offset: 1 },
      expect.anything(),
    );
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2);
    expect(wrapper.get('[aria-selected="true"]').getComponent(QItemSection).text()).toBe('Анна');
    expect(
      wrapper
        .findAllComponents(QBtn)
        .some((button) => button.props('label') === ru.manager.chat.forward.more),
    ).toBe(false);
    wrapper.unmount();
  });
});
