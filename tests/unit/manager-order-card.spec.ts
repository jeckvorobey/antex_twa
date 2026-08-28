import { mount } from '@vue/test-utils';
import { QBadge, QBtn, QCard, QIcon, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';

import OrderCard from '@components/orders/OrderCard.vue';
import AppCurrencyMark from '@components/ui/AppCurrencyMark.vue';
import ru from '@i18n/ru';
import type { ManagerOrderSummary } from '@types/manager-chat';

type ManagerOrderFixture = ManagerOrderSummary & {
  country: string;
  city: {
    id: number;
    name: string;
    country: string;
    countryRuName: string;
    countryCode: string;
    countryFlag: string;
  } | null;
};

function makeOrder(overrides: Partial<ManagerOrderFixture> = {}): ManagerOrderFixture {
  return {
    id: 17,
    publicNumber: '2026080127',
    currencySell: 'RUB',
    amountSell: 20_000,
    currencyBuy: 'VND',
    amountBuy: 5_979_619.21,
    rate: 271.6,
    rateDisplay: '271.60',
    rateText: '1 RUB = 271.60 VND',
    country: 'vietnam',
    city: {
      id: 5,
      name: 'Хошимин',
      country: 'vietnam',
      countryRuName: 'Вьетнам',
      countryCode: 'vn',
      countryFlag: '🇻🇳',
    },
    status: 2,
    methodGet: 'cash',
    createdAt: '2026-08-19T20:08:00+03:00',
    user: {
      id: 41,
      telegramId: 900_001,
      username: 'must-not-be-card-name',
      firstName: 'Сергей',
      lastName: 'Иванов',
      photoUrl: null,
    },
    ...overrides,
  };
}

function mountCard(order: ManagerOrderFixture) {
  const i18n = createI18n({
    legacy: false,
    locale: 'ru',
    messages: { ru },
  });
  return mount(OrderCard, {
    props: { order, mode: 'manager', actions: true },
    global: {
      plugins: [Quasar, i18n],
      components: { QBadge, QBtn, QCard, QIcon },
      stubs: {
        QTooltip: { template: '<span class="test-tooltip"><slot /></span>' },
      },
    },
  });
}

describe('OrderCard manager mode', () => {
  it('renders backend full name, currency marks and country before optional city', () => {
    const wrapper = mountCard(makeOrder());

    expect(wrapper.classes()).toContain('antex-card--gold-border');
    expect(wrapper.get('.manager-order-card__number').text()).toBe('#2026080127');
    expect(wrapper.get('.manager-order-card__customer').text()).toBe('Сергей Иванов');
    expect(wrapper.text()).not.toContain('@must-not-be-card-name');
    expect(wrapper.get('.manager-order-card__location').text()).toContain('Вьетнам, Хошимин');
    expect(wrapper.get('.manager-order-card__rate').text()).toContain('1 RUB = 271.60 VND');
    expect(wrapper.findAllComponents(AppCurrencyMark).map((item) => item.props('mark'))).toEqual([
      '🇷🇺',
      '🇻🇳',
    ]);
  });

  it('uses a neutral client-id fallback and omits the city separator', () => {
    const wrapper = mountCard(
      makeOrder({
        city: null,
        user: {
          id: 77,
          telegramId: 900_077,
          username: 'username-is-not-a-name',
          firstName: null,
          lastName: null,
          photoUrl: null,
        },
      }),
    );

    expect(wrapper.get('.manager-order-card__customer').text()).toBe('Клиент #77');
    expect(wrapper.get('.manager-order-card__location').text()).toContain('Вьетнам');
    expect(wrapper.get('.manager-order-card__location').text()).not.toContain(',');
    expect(wrapper.text()).not.toContain('username-is-not-a-name');
  });

  it('exposes processing actions with localized accessible names and hints', async () => {
    const wrapper = mountCard(makeOrder());
    const chat = wrapper.get('[aria-label="Открыть чат клиента"]');
    const complete = wrapper.get('[aria-label="Завершить заявку"]');
    const cancel = wrapper.get('[aria-label="Отменить заявку"]');

    expect(chat.text()).toContain('Открыть чат клиента');
    expect(complete.text()).toContain('Завершить заявку');
    expect(cancel.text()).toContain('Отменить заявку');

    await chat.trigger('click');
    await complete.trigger('click');
    await cancel.trigger('click');

    expect(wrapper.emitted('openChat')).toHaveLength(1);
    expect(wrapper.emitted('complete')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });
});
