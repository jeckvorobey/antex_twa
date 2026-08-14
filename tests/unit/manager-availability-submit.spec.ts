import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  QBtn,
  QCard,
  QDialog,
  QForm,
  QIcon,
  QInput,
  QOptionGroup,
  QPage,
  QSelect,
  Notify,
} from 'quasar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';

vi.mock('@boot/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import ExchangeOrderDetails from '@components/orders/ExchangeOrderDetails.vue';
import OrderFormSheet from '@components/orders/OrderFormSheet.vue';
import { api } from '@boot/axios';
import ExchangePage from '@pages/ExchangePage.vue';

installQuasarPlugin({
  components: { QBtn, QCard, QDialog, QForm, QIcon, QInput, QOptionGroup, QPage, QSelect },
  plugins: { Notify },
});

afterEach(() => {
  document.body.replaceChildren();
});

const availability = (status: 'working' | 'offline') => ({
  status,
  scheduleEnabled: true,
  workingDaysUtc: [1, 2, 3, 4, 5, 6, 7],
  startTimeUtc: '06:00',
  endTimeUtc: '18:00',
  currentStartAt: null,
  currentEndAt: null,
  nextStartAt: null,
  businessHoursText: 'Ежедневно с 09:00 до 21:00 МСК',
});

const exchangeScreen = () => ({
  calculator: { fromCurrency: 'RUB', toCurrency: 'GEL', amountSell: 30000 },
  chips: ['RUB', 'GEL', 'THB'],
  pairs: [
    {
      id: 'rub-gel',
      label: 'RUB/GEL',
      country: 'georgia',
      countryLabel: 'Грузия',
      countryFlag: '🇬🇪',
      fromCurrency: 'RUB',
      toCurrency: 'GEL',
      rate: 33.33,
      calculationRate: 0.03,
      rateDisplay: '33.33',
      rateText: '1 GEL = 33.33 RUB',
      amountSellExample: 30000,
      amountBuyExample: 900,
      updatedAt: '2026-08-14T00:00:00+00:00',
      availableMethods: ['qrcode', 'cash', 'bank_account', 'pay_services'],
    },
  ],
  quote: {
    currencySell: 'RUB',
    currencyBuy: 'GEL',
    amountSell: 30000,
    amountBuy: 900,
    rate: 0.03,
    rateDisplay: '33.33',
    rateText: '1 GEL = 33.33 RUB',
    updatedAt: '2026-08-14T00:00:00+00:00',
    availableMethods: ['qrcode', 'cash', 'bank_account', 'pay_services'],
  },
  aexPayoutOptions: [],
  managerAvailability: availability('working'),
});

const defaultExchangeScreen = () => ({
  ...exchangeScreen(),
  calculator: { fromCurrency: 'RUB', toCurrency: 'THB', amountSell: 5000 },
  quote: {
    ...exchangeScreen().quote,
    currencyBuy: 'THB',
    amountSell: 5000,
    amountBuy: 2000,
  },
});

const refreshedQuote = () => ({
  ...exchangeScreen().quote,
  amountBuy: 870,
  rate: 0.029,
  rateDisplay: '34.48',
  rateText: '1 GEL = 34.48 RUB',
  updatedAt: '2026-08-14T01:00:00+00:00',
});

const city = {
  id: 7,
  name: 'Tbilisi',
  country: 'georgia',
  countryRuName: 'Грузия',
  countryCode: 'ge',
  countryFlag: '🇬🇪',
  createdAt: '2026-08-14T00:00:00+00:00',
  updatedAt: '2026-08-14T00:00:00+00:00',
};

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('ExchangePage manager availability submit flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    let exchangeRequests = 0;
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/api/miniapp/exchange') {
        exchangeRequests += 1;
        return { data: exchangeRequests === 1 ? exchangeScreen() : defaultExchangeScreen() };
      }
      if (url === '/api/miniapp/cities') return { data: { items: [city] } };
      if (url === '/api/miniapp/manager-availability') return { data: availability('offline') };
      if (url === '/api/miniapp/exchange/quote') return { data: refreshedQuote() };
      if (url === '/api/miniapp/orders') {
        return { data: { items: [], limit: 10, offset: 0, total: 0, hasMore: false } };
      }
      if (url === '/api/miniapp/aex/referral') return { data: { programConfig: {} } };
      if (url === '/api/aex/wallet') return { data: { balanceAvailable: 0 } };
      throw new Error(`Unexpected GET ${url}`);
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 1,
        publicNumber: 'AEX-1',
        cityId: 7,
        country: 'georgia',
        currencySell: 'RUB',
        amountSell: 30000,
        currencyBuy: 'GEL',
        amountBuy: 870,
        rate: 0.029,
        rateDisplay: '33.33',
        rateText: '1 GEL = 33.33 RUB',
        status: 0,
        methodGet: 'cash',
        contactTelegram: null,
        createdAt: '2026-08-14T00:00:00+00:00',
        updatedAt: '2026-08-14T00:00:00+00:00',
        city,
        managerAvailability: availability('offline'),
      },
    });
  });

  it('keeps cash and city through offline confirmation and posts the selected draft', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/exchange', name: 'exchange', component: ExchangePage },
        { path: '/history', name: 'history', component: { template: '<div />' } },
      ],
    });
    await router.push('/exchange');
    await router.isReady();
    const i18n = createI18n({
      legacy: false,
      locale: 'ru',
      messages: {
        ru: {
          common: { yes: 'Да', cancel: 'Отмена', submit: 'Отправить', exchange: 'Обмен' },
          exchange: {
            quoteUnavailable: 'Нет котировки',
            payAmount: 'Отдаёте',
            receiveCurrency: 'Получаете',
            receiveCountry: 'Страна',
            receiveMethod: 'Способ',
            cash: 'Наличные',
            cashCities: 'Города',
            availablePairs: 'Пары',
          },
          order: {
            rateNoticeTitle: 'Курс',
            rateNotice: 'Курс фиксируется',
            minAmountHint: 'Минимум',
            offlineTitle: 'Менеджеры офлайн',
            offlineText: 'Подтвердите',
            offlineInlineTitle: 'Офлайн',
            offlineInlineNotice: 'Подтвердите',
            success: 'Заявка создана',
          },
        },
      },
    });
    const wrapper = mount(ExchangePage, {
      attachTo: document.body,
      global: { plugins: [router, i18n, createPinia()] },
    });
    await flushPromises();
    await flushPromises();

    const details = wrapper.findComponent(ExchangeOrderDetails);
    await details.vm.$emit('update:selected-method', 'cash');
    await details.vm.$emit('update:selected-city-id', 7);
    await details.vm.$emit('update:amount-sell', 30000);
    await flushPromises();
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/miniapp/manager-availability');
    expect(api.get.mock.calls.filter(([url]) => url === '/api/miniapp/exchange')).toHaveLength(1);
    expect(details.props('selectedMethod')).toBe('cash');
    expect(details.props('selectedCityId')).toBe(7);
    expect(details.props('selectedBuyCurrency')).toBe('GEL');
    expect(api.post).not.toHaveBeenCalled();

    const confirmButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Да',
    );
    expect(confirmButton).toBeDefined();
    confirmButton!.click();
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/api/miniapp/orders', {
      country: 'georgia',
      cityId: 7,
      currencySell: 'RUB',
      currencyBuy: 'GEL',
      amountSell: 30000,
      amountBuy: 870,
      rate: 0.029,
      methodGet: 'cash',
    });
    expect(api.get).toHaveBeenCalledWith('/api/miniapp/exchange/quote', {
      params: { currencySell: 'RUB', currencyBuy: 'GEL', amountSell: 30000 },
    });
    expect(api.get).toHaveBeenCalledWith(
      '/api/miniapp/orders',
      expect.objectContaining({
        params: { limit: 10, offset: 0 },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each(['qrcode', 'bank_account', 'pay_services'] as const)(
    'posts the explicitly selected %s method without a city',
    async (method) => {
      vi.mocked(api.get).mockImplementation(async (url: string) => {
        if (url === '/api/miniapp/exchange') return { data: exchangeScreen() };
        if (url === '/api/miniapp/cities') return { data: { items: [city] } };
        if (url === '/api/miniapp/manager-availability') return { data: availability('working') };
        if (url === '/api/miniapp/exchange/quote') return { data: refreshedQuote() };
        if (url === '/api/miniapp/aex/referral') return { data: { programConfig: {} } };
        if (url === '/api/aex/wallet') return { data: { balanceAvailable: 0 } };
        throw new Error(`Unexpected GET ${url}`);
      });
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/exchange', name: 'exchange', component: ExchangePage },
          { path: '/history', name: 'history', component: { template: '<div />' } },
        ],
      });
      await router.push('/exchange');
      await router.isReady();
      const wrapper = mount(ExchangePage, {
        attachTo: document.body,
        global: {
          plugins: [
            router,
            createI18n({
              legacy: false,
              locale: 'ru',
              messages: { ru: { common: { submit: 'Отправить' } } },
              missingWarn: false,
              fallbackWarn: false,
            }),
            createPinia(),
          ],
        },
      });
      await flushPromises();
      await flushPromises();

      const details = wrapper.findComponent(ExchangeOrderDetails);
      await details.vm.$emit('update:selected-method', method);
      await details.vm.$emit('update:amount-sell', 30000);
      await flushPromises();

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(api.post).toHaveBeenCalledWith('/api/miniapp/orders', {
        country: 'georgia',
        cityId: null,
        currencySell: 'RUB',
        currencyBuy: 'GEL',
        amountSell: 30000,
        amountBuy: 870,
        rate: 0.029,
        methodGet: method,
      });
    },
  );
});

describe('OrderFormSheet manager availability submit flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/api/miniapp/exchange') return { data: exchangeScreen() };
      if (url === '/api/miniapp/cities') return { data: { items: [city] } };
      if (url === '/api/miniapp/manager-availability') return { data: availability('offline') };
      if (url === '/api/miniapp/exchange/quote') return { data: refreshedQuote() };
      if (url === '/api/miniapp/orders') {
        return { data: { items: [], limit: 10, offset: 0, total: 0, hasMore: false } };
      }
      throw new Error(`Unexpected GET ${url}`);
    });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
  });

  it('posts cash and city after the second offline step without refreshing the exchange screen', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
    });
    await router.push('/');
    await router.isReady();
    const i18n = createI18n({
      legacy: false,
      locale: 'ru',
      messages: { ru: { common: { yes: 'Да', cancel: 'Отмена', submit: 'Отправить' } } },
      missingWarn: false,
      fallbackWarn: false,
    });
    const wrapper = mount(OrderFormSheet, {
      attachTo: document.body,
      props: { modelValue: true },
      global: { plugins: [router, i18n, createPinia()] },
    });
    await flushPromises();
    await flushPromises();

    const details = wrapper.findComponent(ExchangeOrderDetails);
    await details.vm.$emit('update:selected-method', 'cash');
    await details.vm.$emit('update:selected-city-id', 7);
    await details.vm.$emit('update:amount-sell', 30000);
    await flushPromises();
    await flushPromises();

    const submitButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Отправить',
    );
    expect(submitButton).toBeDefined();
    submitButton!.click();
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('/api/miniapp/manager-availability');
    expect(api.get.mock.calls.filter(([url]) => url === '/api/miniapp/exchange')).toHaveLength(1);
    expect(details.props('selectedMethod')).toBe('cash');
    expect(details.props('selectedCityId')).toBe(7);

    const confirmButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Да',
    );
    expect(confirmButton).toBeDefined();
    confirmButton!.click();
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/api/miniapp/orders', {
      country: 'georgia',
      cityId: 7,
      currencySell: 'RUB',
      currencyBuy: 'GEL',
      amountSell: 30000,
      amountBuy: 870,
      rate: 0.029,
      methodGet: 'cash',
    });
    expect(api.get).toHaveBeenCalledWith('/api/miniapp/exchange/quote', {
      params: { currencySell: 'RUB', currencyBuy: 'GEL', amountSell: 30000 },
    });
    expect(api.get).toHaveBeenCalledWith(
      '/api/miniapp/orders',
      expect.objectContaining({
        params: { limit: 10, offset: 0 },
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
