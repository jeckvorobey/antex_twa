import { createPinia, setActivePinia } from 'pinia';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { flushPromises, mount } from '@vue/test-utils';
import { QBtn, QCard, QIcon, QSkeleton, QSpinner, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ManagerOrdersPage from '@pages/manager/ManagerOrdersPage.vue';
import ManagerOrderPage from '@pages/manager/ManagerOrderPage.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import type { ManagerOrderSummary } from '@types/manager-chat';
import ru from '@i18n/ru';

const managerOrdersSource = readFileSync(
  resolve(process.cwd(), 'src/pages/manager/ManagerOrdersPage.vue'),
  'utf8',
);
const managerOrderSource = readFileSync(
  resolve(process.cwd(), 'src/pages/manager/ManagerOrderPage.vue'),
  'utf8',
);

const { routerPush, routeHarness } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routeHarness: {} as { route?: { params: { orderId: string } } },
}));

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  routeHarness.route = reactive({ params: { orderId: '1' } });
  return {
    useRouter: () => ({ push: routerPush }),
    useRoute: () => routeHarness.route,
  };
});

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
}));

import { fetchManagerOrder, fetchManagerOrders } from '@services/manager-chat';

function makeOrder(id = 1): ManagerOrderSummary {
  return {
    id,
    publicNumber: `202608${String(id).padStart(4, '0')}`,
    currencySell: 'RUB',
    amountSell: 20_000,
    currencyBuy: 'VND',
    amountBuy: 5_979_619.21,
    rate: 271.6,
    rateDisplay: '271.60',
    rateText: '1 RUB = 271.60 VND',
    country: 'vietnam',
    city: null,
    status: 2,
    methodGet: 'qrcode',
    createdAt: '2026-08-19T20:08:00+03:00',
    user: {
      id: 41,
      telegramId: 900_041,
      username: 'client',
      firstName: 'Сергей',
      lastName: 'Иванов',
      photoUrl: null,
    },
  };
}

function managerPageGlobal(pinia: ReturnType<typeof createPinia>) {
  return {
    plugins: [
      pinia,
      Quasar,
      createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
    ],
    components: { QBtn, QCard, QIcon, QSkeleton, QSpinner },
    stubs: {
      ManagerPageHeader: true,
      OrderCard: true,
      QPage: { template: '<main><slot /></main>' },
    },
  };
}

describe('manager orders workflow state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    routeHarness.route!.params.orderId = '1';
  });

  it('reloads order details when Vue reuses the page for another route id', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.mocked(fetchManagerOrder).mockImplementation(async (id) => makeOrder({ id }));

    mount(ManagerOrderPage, { global: managerPageGlobal(pinia) });
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledWith(1));

    routeHarness.route!.params.orderId = '2';
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledWith(2));
  });

  it('uses shared skeletons, busy semantics and shared empty states', () => {
    expect(managerOrdersSource).toContain('<AntexSkeleton preset="order-card"');
    expect(managerOrdersSource).toContain(':aria-busy="chatStore.ordersLoading"');
    expect(managerOrdersSource).toContain('<AntexEmptyState');
    expect(managerOrdersSource).not.toContain('<q-spinner');
  });

  it('preserves manager order actions, safeguards and state reconciliation', () => {
    expect(managerOrdersSource).toContain('@open-chat="openChat(order.id)"');
    expect(managerOrdersSource).toContain('@open-details="openDetails(order.id)"');
    expect(managerOrderSource).toContain('@click="openChat"');
    expect(managerOrderSource).toContain('@click="setStatus(2)"');
    expect(managerOrderSource).toContain('@click="setStatus(3)"');
    expect(managerOrderSource).toContain('@click="confirmCancel"');
    expect(managerOrderSource).toContain(':loading="changingStatus"');
    expect(managerOrderSource).toContain(':disable="changingStatus"');
    expect(managerOrderSource).toContain('Dialog.create({');
    expect(managerOrderSource).toContain('.onOk(() => {');
    expect(managerOrderSource).toContain('void setStatus(4);');
    expect(managerOrderSource).toContain('await chatStore.loadOrders();');
  });

  it('keeps a failed orders request distinct from an empty successful list', async () => {
    const store = useManagerChatStore();
    vi.mocked(fetchManagerOrders).mockRejectedValueOnce(new Error('network unavailable'));

    await expect(store.loadOrders()).rejects.toThrow('network unavailable');
    expect(store.orders).toEqual([]);
    expect(store.ordersError).toBe('load_failed');

    vi.mocked(fetchManagerOrders).mockResolvedValueOnce({ items: [] });
    await store.loadOrders();
    expect(store.ordersError).toBeNull();
  });

  it('tracks detail failure separately and clears stale order data', async () => {
    const store = useManagerChatStore();
    vi.mocked(fetchManagerOrder).mockResolvedValueOnce(makeOrder());
    await store.loadOrder(1);
    expect(store.activeOrder?.id).toBe(1);

    vi.mocked(fetchManagerOrder).mockRejectedValueOnce(new Error('not found'));
    await expect(store.loadOrder(2)).rejects.toThrow('not found');

    expect(store.activeOrder).toBeNull();
    expect(store.activeOrderError).toBe('load_failed');
  });

  it('shows a retryable localized error instead of an empty state', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.mocked(fetchManagerOrders)
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ items: [] });
    const wrapper = mount(ManagerOrdersPage, {
      global: managerPageGlobal(pinia),
    });

    await vi.waitFor(() => expect(fetchManagerOrders).toHaveBeenCalledTimes(1));
    await flushPromises();
    expect(wrapper.text()).toContain('Не удалось загрузить заявки');
    expect(wrapper.text()).not.toContain('Активных заявок нет');

    await wrapper.get('button').trigger('click');
    await vi.waitFor(() => expect(fetchManagerOrders).toHaveBeenCalledTimes(2));
    await flushPromises();
    expect(wrapper.text()).toContain('Активных заявок нет');
  });

  it('renders operational order details from the backend DTO', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.mocked(fetchManagerOrder).mockResolvedValueOnce(makeOrder());

    const wrapper = mount(ManagerOrderPage, { global: managerPageGlobal(pinia) });
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledWith(1));
    await flushPromises();

    expect(wrapper.text()).toContain('Данные заявки');
    expect(wrapper.text()).toContain('Сергей Иванов');
    expect(wrapper.text()).toContain('Страна');
    expect(wrapper.text()).toContain('Вьетнам');
    expect(wrapper.text()).toContain('Способ получения');
    expect(wrapper.text()).toContain('QR code');
  });

  it('keeps a failed detail route retryable instead of navigating away', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.mocked(fetchManagerOrder)
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(makeOrder());

    const wrapper = mount(ManagerOrderPage, { global: managerPageGlobal(pinia) });
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledTimes(1));
    await flushPromises();

    expect(wrapper.text()).toContain('Не удалось загрузить заявку');
    expect(routerPush).not.toHaveBeenCalled();

    await wrapper.get('button').trigger('click');
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledTimes(2));
    await flushPromises();
    expect(wrapper.text()).toContain('Данные заявки');
  });
});
