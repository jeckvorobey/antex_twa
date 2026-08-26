import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { GroupedOrders, MiniappOrderItem } from '@types/miniapp';

const componentPath = resolve(process.cwd(), 'src/components/orders/OrderHistoryList.vue');

function makeOrder(id: number): MiniappOrderItem {
  return {
    id,
    publicNumber: `202608${String(id).padStart(4, '0')}`,
    cityId: null,
    country: 'thailand',
    currencySell: 'RUB',
    amountSell: 10_000,
    currencyBuy: 'THB',
    amountBuy: 3_700,
    rate: 0.37,
    rateDisplay: '0.37',
    rateText: '1 RUB = 0.37 THB',
    status: 3,
    methodGet: 'cash',
    contactTelegram: '@client',
    createdAt: '2026-08-26T12:00:00+03:00',
    updatedAt: '2026-08-26T12:00:00+03:00',
    city: null,
  };
}

describe('OrderHistoryList', () => {
  it('renders grouped user OrderCards and emits the original repeat order', async () => {
    expect(existsSync(componentPath)).toBe(true);
    const { default: OrderHistoryList } = await import(/* @vite-ignore */ componentPath);
    const first = makeOrder(1);
    const second = makeOrder(2);
    const groups: GroupedOrders[] = [
      { label: 'Сегодня', items: [first] },
      { label: 'Вчера', items: [second] },
    ];

    const wrapper = mount(OrderHistoryList, {
      props: { groups },
      global: {
        stubs: {
          OrderCard: {
            props: ['order', 'mode'],
            emits: ['repeat'],
            template:
              '<button class="test-order-card" :data-mode="mode" @click="$emit(\'repeat\')">{{ order.publicNumber }}</button>',
          },
        },
      },
    });

    expect(wrapper.findAll('.app-group-label--history').map((item) => item.text())).toEqual([
      'Сегодня',
      'Вчера',
    ]);
    expect(wrapper.findAll('.test-order-card')).toHaveLength(2);
    expect(
      wrapper.findAll('.test-order-card').every((item) => item.attributes('data-mode') === 'user'),
    ).toBe(true);

    await wrapper.findAll('.test-order-card')[1]!.trigger('click');
    expect(wrapper.emitted('repeat')).toEqual([[second]]);
  });
});
