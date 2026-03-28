import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@pages/HomePage.vue'),
        meta: { title: 'home.title' },
      },
      {
        path: 'exchange',
        name: 'exchange',
        component: () => import('@pages/ExchangePage.vue'),
        meta: { title: 'exchange.title' },
      },
      {
        path: 'history',
        name: 'history',
        component: () => import('@pages/HistoryPage.vue'),
        meta: { title: 'history.title' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@pages/ProfilePage.vue'),
        meta: { title: 'profile.title' },
      },
    ],
  },
  { path: '/:catchAll(.*)*', redirect: '/' },
];

export default routes;
