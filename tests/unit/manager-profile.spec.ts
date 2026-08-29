import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { QAvatar, QBtn, QCard, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { beforeEach, describe, expect, it } from 'vitest';

import ru from '@i18n/ru';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import ManagerProfilePage from '@pages/manager/ManagerProfilePage.vue';
import { useAuthStore } from '@stores/auth.store';

describe('manager profile identity', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows only a sanitized Telegram photo and falls back to initials', async () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 1,
      username: 'manager',
      phone: null,
      first_name: 'Мария',
      last_name: 'Иванова',
      language_code: 'ru',
      photo_url: 'https://cdn.example.test/manager.jpg',
      is_bot: false,
      is_premium: false,
      telegram_write_access: true,
      role: 'manager',
      trusted_contact: null,
      trusted_contact_source: null,
      trusted_contact_ready: false,
    };

    const wrapper = mount(ManagerProfilePage, {
      global: {
        plugins: [
          Quasar,
          createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
        ],
        components: { QAvatar, QCard },
        stubs: {
          AppHeaderBar: true,
          ConnectionStatePill: true,
          QPage: { template: '<main><slot /></main>' },
          QImg: {
            props: ['src', 'alt'],
            emits: ['error'],
            template:
              '<img class="manager-profile-photo-stub" :src="src" :alt="alt" @error="$emit(\'error\')" />',
          },
        },
      },
    });

    expect(wrapper.get('.manager-profile-photo-stub').attributes('src')).toBe(
      'https://cdn.example.test/manager.jpg',
    );
    expect(wrapper.find('.manager-profile-card__initials').exists()).toBe(false);

    await wrapper.get('.manager-profile-photo-stub').trigger('error');

    expect(wrapper.find('.manager-profile-photo-stub').exists()).toBe(false);
    expect(wrapper.get('.manager-profile-card__initials').text()).toBe('МИ');

    authStore.user.photo_url = 'https://cdn.example.test/manager-new.jpg';
    await wrapper.vm.$nextTick();

    expect(wrapper.get('.manager-profile-photo-stub').attributes('src')).toBe(
      'https://cdn.example.test/manager-new.jpg',
    );

    authStore.user.photo_url = 'javascript:alert(1)';
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.manager-profile-photo-stub').exists()).toBe(false);
    expect(wrapper.get('.manager-profile-card__initials').text()).toBe('МИ');
  });

  it('falls back to initials when the header photo cannot load', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    authStore.user = {
      id: 1,
      username: 'manager',
      phone: null,
      first_name: 'Мария',
      last_name: 'Иванова',
      language_code: 'ru',
      photo_url: 'https://cdn.example.test/header.jpg',
      is_bot: false,
      is_premium: false,
      telegram_write_access: true,
      role: 'manager',
      trusted_contact: null,
      trusted_contact_source: null,
      trusted_contact_ready: false,
    };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/manager/profile', name: 'managerProfile', component: { template: '<div />' } },
      ],
    });
    await router.push('/');
    await router.isReady();

    const wrapper = mount(AppHeaderBar, {
      props: { profileRouteName: 'managerProfile' },
      global: {
        plugins: [
          pinia,
          router,
          Quasar,
          createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
        ],
        components: { QAvatar, QBtn },
        stubs: {
          AppBackButton: true,
          QImg: {
            props: ['src', 'alt'],
            emits: ['error'],
            template:
              '<img class="header-image-stub" :src="src" :alt="alt" @error="$emit(\'error\')" />',
          },
        },
      },
    });
    const avatarPhoto = wrapper
      .findAll('.header-image-stub')
      .find((image) => image.attributes('src') === 'https://cdn.example.test/header.jpg');

    expect(avatarPhoto).toBeDefined();
    await avatarPhoto!.trigger('error');

    expect(wrapper.find('.app-header-bar__avatar .header-image-stub').exists()).toBe(false);
    expect(wrapper.get('.app-header-bar__avatar span').text()).toBe('МИ');
  });
});
