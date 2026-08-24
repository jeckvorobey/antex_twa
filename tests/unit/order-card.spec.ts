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

function mountCard(mode: 'user' | 'manager', actions = true) {
  const i18n = createI18n({ legacy: false, locale: 'ru', messages: { ru } });
  const order: MiniappOrderItem | ManagerOrderSummary =
    mode === 'user'
      ? baseOrder
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
        };
  return mount(OrderCard, {
    props: { order, mode, actions },
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
    }
    expect(user.attributes('data-order-card-mode')).toBe('user');
    expect(manager.attributes('data-order-card-mode')).toBe('manager');
    expect(user.find('.order-card__customer').exists()).toBe(false);
    expect(manager.get('.order-card__customer').text()).toBe('Сергей Иванов');
  });

  it('places time before the right-aligned action group and emits user repeat', async () => {
    const wrapper = mountCard('user');
    const bottom = wrapper.get('.order-card__bottom');

    expect(bottom.element.firstElementChild?.classList).toContain('order-card__time');
    expect(bottom.element.lastElementChild?.classList).toContain('order-card__actions');
    await wrapper.get('[aria-label="Повторить"]').trigger('click');
    expect(wrapper.emitted('repeat')).toHaveLength(1);
  });

  it('adds only manager actions in manager mode and keeps 44px action classes', async () => {
    const wrapper = mountCard('manager');
    const details = wrapper.get('[aria-label="Открыть детали заявки"]');
    const chat = wrapper.get('[aria-label="Открыть чат клиента"]');

    expect(wrapper.find('[aria-label="Повторить"]').exists()).toBe(false);
    expect(wrapper.findAll('.order-card__action')).toHaveLength(2);
    await details.trigger('click');
    await chat.trigger('click');
    expect(wrapper.emitted('openDetails')).toHaveLength(1);
    expect(wrapper.emitted('openChat')).toHaveLength(1);
  });

  it('emits select from an explicitly selectable card for click and keyboard', async () => {
    const wrapper = mountCard('manager', false);
    await wrapper.setProps({ selectable: true });

    expect(wrapper.attributes('role')).toBe('button');
    expect(wrapper.attributes('tabindex')).toBe('0');
    await wrapper.trigger('keydown', { key: 'Enter' });
    await wrapper.trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('select')).toHaveLength(2);
  });
});
