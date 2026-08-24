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
      {
        path: 'referral',
        name: 'referral',
        component: () => import('@pages/ReferralPage.vue'),
        meta: { title: 'referral.title', backRouteName: 'profile' },
      },
      {
        path: 'referral/referrals',
        name: 'referralReferrals',
        component: () => import('@pages/ReferralReferralsPage.vue'),
        meta: { title: 'referral.myReferrals', backRouteName: 'referral' },
      },
      {
        path: 'referral/operations',
        name: 'referralOperations',
        component: () => import('@pages/ReferralOperationsPage.vue'),
        meta: { title: 'referral.history', backRouteName: 'referral' },
      },
    ],
  },
  {
    path: '/manager',
    component: () => import('@layouts/ManagerLayout.vue'),
    meta: { managerOnly: true },
    children: [
      { path: '', redirect: { name: 'managerChats' } },
      {
        path: 'chats',
        name: 'managerChats',
        component: () => import('@pages/manager/ManagerChatsPage.vue'),
        meta: { managerOnly: true, title: 'manager.chats.title' },
      },
      {
        path: 'chats/:conversationId',
        name: 'managerChat',
        component: () => import('@pages/manager/ManagerChatPage.vue'),
        meta: { managerOnly: true, title: 'manager.chat.title' },
      },
      {
        path: 'orders',
        name: 'managerOrders',
        component: () => import('@pages/manager/ManagerOrdersPage.vue'),
        meta: { managerOnly: true, title: 'manager.orders.title' },
      },
      {
        path: 'orders/:orderId',
        name: 'managerOrder',
        component: () => import('@pages/manager/ManagerOrderPage.vue'),
        meta: { managerOnly: true, title: 'manager.orderPage.title' },
      },
      {
        path: 'profile',
        name: 'managerProfile',
        component: () => import('@pages/manager/ManagerProfilePage.vue'),
        meta: { managerOnly: true, title: 'manager.profile.title' },
      },
    ],
  },
  { path: '/:catchAll(.*)*', redirect: '/' },
];

export default routes;
