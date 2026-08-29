import { mount } from '@vue/test-utils';
import { QBadge, QBtn, QCard, QIcon, QTooltip, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';

import OrderCard from '@components/orders/OrderCard.vue';
import ru from '@i18n/ru';
import type { ManagerOrderSummary } from '@types/manager-chat';
import type { MiniappOrderItem } from '@types/miniapp';

const baseOrder: MiniappOrderItem = {
  id: 12,
  publicNumber: '2026080124',
  cityId: 5,
  country: 'thailand',
  currencySell: 'RUB',
  amountSell: 25_000,
  currencyBuy: 'THB',
  amountBuy: 9_237.35,
  rate: 2.71,
  rateDisplay: '2.71',
  rateText: '1 THB = 2.71 RUB',
  status: 3,
  methodGet: 'cash',
  contactTelegram: null,
  createdAt: '2026-08-19T20:34:00Z',
  updatedAt: '2026-08-19T20:34:00Z',
  city: {
    id: 5,
    name: 'Паттайя',
    country: 'thailand',
    countryRuName: 'Таиланд',
    countryCode: 'th',
    countryFlag: '🇹🇭',
  },
};

function mountCard(
  mode: 'user' | 'manager',
  actions = true,
  overrides: Partial<MiniappOrderItem | ManagerOrderSummary> = {},
  pendingActions: string[] = [],
) {
  const i18n = createI18n({ legacy: false, locale: 'ru', messages: { ru } });
  const order: MiniappOrderItem | ManagerOrderSummary =
    mode === 'user'
      ? { ...baseOrder, ...overrides }
      : {
          ...baseOrder,
          user: {
            id: 41,
            telegramId: 900_001,
            username: 'not-a-name',
            firstName: 'Сергей',
            lastName: 'Иванов',
            photoUrl: null,
          },
          ...overrides,
        };
  return mount(OrderCard, {
    props: { order, mode, actions, pendingActions },
    global: {
      plugins: [Quasar, i18n],
      components: { QBadge, QBtn, QCard, QIcon, QTooltip },
      stubs: { QTooltip: { template: '<span><slot /></span>' } },
    },
  });
}

describe('shared OrderCard', () => {
  it('keeps one gold card anatomy for user and manager modes', () => {
    const user = mountCard('user');
    const manager = mountCard('manager');

    for (const wrapper of [user, manager]) {
      expect(wrapper.classes()).toContain('order-card');
      expect(wrapper.classes()).toContain('antex-card--gold-border');
      expect(wrapper.get('.order-card__number').text()).toBe('#2026080124');
      expect(wrapper.get('.order-card__status').text()).toContain('Завершена');
      expect(wrapper.get('.order-card__location').text()).toContain('Таиланд, Паттайя');
      expect(wrapper.get('.order-amount-flow--card-stack').exists()).toBe(true);
      expect(wrapper.find('.order-amount-flow__side').exists()).toBe(false);
      expect(wrapper.find('.order-amount-flow__arrow').exists()).toBe(false);
      expect(wrapper.get('.order-amount-flow__source-amount').text()).toBe('25 000');
      expect(wrapper.get('.order-amount-flow__source-currency').text()).toBe('RUB');
      expect(wrapper.get('.order-amount-flow__rate-inline').text()).toContain('1 THB = 2.71 RUB');
      expect(wrapper.get('.order-amount-flow__result-amount').text()).toBe('9 237,35');
      expect(wrapper.get('.order-amount-flow__result-currency').text()).toBe('THB');
    }
    expect(user.attributes('data-order-card-mode')).toBe('user');
    expect(manager.attributes('data-order-card-mode')).toBe('manager');
    expect(user.attributes('data-order-card-status')).toBe('3');
    expect(manager.attributes('data-order-card-status')).toBe('3');
    expect(user.find('.order-card__customer').exists()).toBe(false);
    expect(manager.get('.order-card__customer').text()).toBe('Сергей Иванов');
    expect(manager.html()).not.toContain('manager-order-card__');
  });

  it('places time before the right-aligned action group and emits user repeat', async () => {
    const wrapper = mountCard('user', true, { status: 3 });
    const bottom = wrapper.get('.order-card__bottom');

    expect(wrapper.classes()).toContain('order-card--regular');
    expect(wrapper.classes()).not.toContain('order-card--compact');
    expect(bottom.element.firstElementChild?.classList).toContain('order-card__time');
    expect(bottom.element.lastElementChild?.classList).toContain('order-card__actions');
    await wrapper.get('[aria-label="Повторить"]').trigger('click');
    expect(wrapper.emitted('repeat')).toHaveLength(1);
  });

  it('uses status-specific customer actions and compact density when there is no action', async () => {
    const newOrder = mountCard('user', true, { status: 1 });
    expect(newOrder.findAll('.order-card__action')).toHaveLength(0);
    expect(newOrder.classes()).toContain('order-card--compact');

    const activeOrder = mountCard('user', true, { status: 2 });
    expect(activeOrder.findAll('.order-card__action')).toHaveLength(0);
    expect(activeOrder.classes()).toContain('order-card--compact');

    const cancelledOrder = mountCard('user', true, { status: 4 });
    await cancelledOrder.get('[aria-label="Повторить"]').trigger('click');
    expect(cancelledOrder.emitted('repeat')).toHaveLength(1);
  });

  it('adds status-specific manager actions with compact Penpot action visuals', async () => {
    const newOrder = mountCard('manager', true, { status: 1 });
    const newDetails = newOrder.get('[aria-label="Открыть детали заявки"]');
    const newChat = newOrder.get('[aria-label="Открыть чат клиента"]');
    const take = newOrder.get('[aria-label="Взять в работу"]');

    expect(newOrder.findAll('.order-card__action')).toHaveLength(3);
    expect(newOrder.findAll('.order-card__action-visual')).toHaveLength(3);
    await newDetails.trigger('click');
    await newChat.trigger('click');
    await take.trigger('click');
    expect(newOrder.emitted('openDetails')).toHaveLength(1);
    expect(newOrder.emitted('openChat')).toHaveLength(1);
    expect(newOrder.emitted('take')).toHaveLength(1);

    const wrapper = mountCard('manager', true, { status: 2 });
    const details = wrapper.get('[aria-label="Открыть детали заявки"]');
    const chat = wrapper.get('[aria-label="Открыть чат клиента"]');
    const complete = wrapper.get('[aria-label="Завершить заявку"]');
    const cancel = wrapper.get('[aria-label="Отменить заявку"]');

    expect(wrapper.find('[aria-label="Повторить"]').exists()).toBe(false);
    expect(wrapper.findAll('.order-card__action')).toHaveLength(4);
    await details.trigger('click');
    await chat.trigger('click');
    await complete.trigger('click');
    await cancel.trigger('click');
    expect(wrapper.emitted('openDetails')).toHaveLength(1);
    expect(wrapper.emitted('openChat')).toHaveLength(1);
    expect(wrapper.emitted('complete')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    const completedOrder = mountCard('manager', true, { status: 3 });
    expect(completedOrder.findAll('.order-card__action')).toHaveLength(0);
    expect(completedOrder.classes()).toContain('order-card--compact');
  });

  it('emits select from an explicitly selectable card for click and keyboard', async () => {
    const wrapper = mountCard('manager', false, { status: 3 });
    await wrapper.setProps({ selectable: true });

    expect(wrapper.attributes('role')).toBe('button');
    expect(wrapper.attributes('tabindex')).toBe('0');
    await wrapper.trigger('keydown', { key: 'Enter' });
    await wrapper.trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('select')).toHaveLength(2);
  });

  it('does not expose a selectable card role while action buttons are focusable', async () => {
    const wrapper = mountCard('manager', true, { status: 2 });
    await wrapper.setProps({ selectable: true });

    expect(wrapper.findAll('.order-card__action')).toHaveLength(4);
    expect(wrapper.classes()).not.toContain('order-card--selectable');
    expect(wrapper.attributes('role')).toBeUndefined();
    expect(wrapper.attributes('tabindex')).toBeUndefined();
    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('disables pending manager status actions without blocking details or chat', () => {
    const wrapper = mountCard('manager', true, { status: 2 }, ['complete', 'cancel']);

    expect(wrapper.get('[aria-label="Открыть детали заявки"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('[aria-label="Открыть чат клиента"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('[aria-label="Завершить заявку"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Отменить заявку"]').attributes('disabled')).toBeDefined();
  });
});
