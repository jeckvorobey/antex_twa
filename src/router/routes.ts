import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/ExchangePage.vue') },
      { path: 'orders', component: () => import('src/pages/OrdersPage.vue') },
    ],
  },
  { path: '/:catchAll(.*)*', redirect: '/' },
];

export default routes;
