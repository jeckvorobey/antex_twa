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

vi.mock('@/composables/useAntexNotify', () => ({
  useAntexNotify: () => ({ notify: vi.fn() }),
}));

import { fetchManagerOrder, fetchManagerOrders, updateManagerOrderStatus } from '@services/manager-chat';

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

  it('locks manager status actions until the current update completes', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    let resolveUpdate: (order: ManagerOrderSummary) => void = () => undefined;
    vi.mocked(fetchManagerOrders).mockResolvedValueOnce({ items: [makeOrder(1)] });
    vi.mocked(updateManagerOrderStatus).mockImplementationOnce(
      () =>
        new Promise<ManagerOrderSummary>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    vi.mocked(updateManagerOrderStatus).mockResolvedValueOnce(makeOrder(1));

    const wrapper = mount(ManagerOrdersPage, {
      global: managerPageGlobal(pinia),
    });

    await vi.waitFor(() => expect(fetchManagerOrders).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'OrderCard' }).exists()).toBe(true));
    const card = wrapper.getComponent({ name: 'OrderCard' });

    card.vm.$emit('take');
    card.vm.$emit('take');
    await flushPromises();
    expect(updateManagerOrderStatus).toHaveBeenCalledTimes(1);

    resolveUpdate(makeOrder(1));
    await flushPromises();
    card.vm.$emit('take');
    await flushPromises();
    expect(updateManagerOrderStatus).toHaveBeenCalledTimes(2);
  });

  it('reconciles the order from backend after a workflow conflict', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useManagerChatStore();
    vi.mocked(fetchManagerOrders).mockResolvedValueOnce({ items: [makeOrder(1)] });
    await store.loadOrders();
    vi.mocked(updateManagerOrderStatus).mockRejectedValueOnce({
      response: { status: 409, data: { code: 'ORDER_STATUS_CONFLICT' } },
    });
    vi.mocked(fetchManagerOrder).mockResolvedValueOnce({ ...makeOrder(1), status: 3 });

    await expect(store.changeOrderStatus(1, 4)).rejects.toMatchObject({
      response: { status: 409 },
    });

    expect(fetchManagerOrder).toHaveBeenCalledWith(1);
    expect(store.orders).toEqual([]);
  });

  it('preserves the original workflow conflict when reconciliation fails', async () => {
    const store = useManagerChatStore();
    const conflict = {
      response: { status: 409, data: { code: 'ORDER_STATUS_CONFLICT' } },
    };
    vi.mocked(updateManagerOrderStatus).mockRejectedValueOnce(conflict);
    vi.mocked(fetchManagerOrder).mockRejectedValueOnce(new Error('network unavailable'));

    await expect(store.changeOrderStatus(1, 4)).rejects.toBe(conflict);
  });

  it('does not overwrite a newer realtime order during conflict reconciliation', async () => {
    const store = useManagerChatStore();
    vi.mocked(fetchManagerOrders).mockResolvedValueOnce({ items: [makeOrder(1)] });
    await store.loadOrders();
    const conflict = {
      response: { status: 409, data: { code: 'ORDER_STATUS_CONFLICT' } },
    };
    vi.mocked(updateManagerOrderStatus).mockRejectedValueOnce(conflict);
    let resolveReconciliation: (order: ManagerOrderSummary) => void = () => undefined;
    vi.mocked(fetchManagerOrder).mockImplementationOnce(
      () =>
        new Promise<ManagerOrderSummary>((resolve) => {
          resolveReconciliation = resolve;
        }),
    );

    const update = store.changeOrderStatus(1, 4);
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledWith(1));
    await store.handleRealtimeEvent({
      type: 'chat.order.updated',
      payload: { order: { ...makeOrder(1), status: 3 } },
    });
    resolveReconciliation(makeOrder(1));

    await expect(update).rejects.toBe(conflict);
    expect(store.orders).toEqual([]);
  });

  it('does not overwrite a newer list refresh during conflict reconciliation', async () => {
    const store = useManagerChatStore();
    vi.mocked(fetchManagerOrders).mockResolvedValueOnce({ items: [makeOrder(1)] });
    await store.loadOrders();
    const conflict = {
      response: { status: 409, data: { code: 'ORDER_STATUS_CONFLICT' } },
    };
    vi.mocked(updateManagerOrderStatus).mockRejectedValueOnce(conflict);
    let resolveReconciliation: (order: ManagerOrderSummary) => void = () => undefined;
    vi.mocked(fetchManagerOrder).mockImplementationOnce(
      () =>
        new Promise<ManagerOrderSummary>((resolve) => {
          resolveReconciliation = resolve;
        }),
    );

    const update = store.changeOrderStatus(1, 4);
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledWith(1));
    vi.mocked(fetchManagerOrders).mockResolvedValueOnce({ items: [] });
    await store.loadOrders();
    resolveReconciliation(makeOrder(1));

    await expect(update).rejects.toBe(conflict);
    expect(store.orders).toEqual([]);
  });

  it('does not abort a pending list refresh during conflict reconciliation', async () => {
    const store = useManagerChatStore();
    vi.mocked(fetchManagerOrders).mockResolvedValueOnce({ items: [makeOrder(1)] });
    await store.loadOrders();
    const conflict = {
      response: { status: 409, data: { code: 'ORDER_STATUS_CONFLICT' } },
    };
    vi.mocked(updateManagerOrderStatus).mockRejectedValueOnce(conflict);
    let resolveReconciliation: (order: ManagerOrderSummary) => void = () => undefined;
    vi.mocked(fetchManagerOrder).mockImplementationOnce(
      () =>
        new Promise<ManagerOrderSummary>((resolve) => {
          resolveReconciliation = resolve;
        }),
    );

    const update = store.changeOrderStatus(1, 4);
    await vi.waitFor(() => expect(fetchManagerOrder).toHaveBeenCalledWith(1));
    let resolveList: (response: { items: ManagerOrderSummary[] }) => void = () => undefined;
    vi.mocked(fetchManagerOrders).mockImplementationOnce(
      () =>
        new Promise<{ items: ManagerOrderSummary[] }>((resolve) => {
          resolveList = resolve;
        }),
    );
    const refresh = store.loadOrders();
    resolveReconciliation(makeOrder(1));
    await expect(update).rejects.toBe(conflict);
    resolveList({ items: [] });
    await refresh;

    expect(store.orders).toEqual([]);
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
