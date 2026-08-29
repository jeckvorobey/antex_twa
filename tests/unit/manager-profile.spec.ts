import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { QAvatar, QCard, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it } from 'vitest';

import ru from '@i18n/ru';
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
            template: '<img class="manager-profile-photo-stub" :src="src" :alt="alt" />',
          },
        },
      },
    });

    expect(wrapper.get('.manager-profile-photo-stub').attributes('src')).toBe(
      'https://cdn.example.test/manager.jpg',
    );
    expect(wrapper.find('.manager-profile-card__initials').exists()).toBe(false);

    authStore.user.photo_url = 'javascript:alert(1)';
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.manager-profile-photo-stub').exists()).toBe(false);
    expect(wrapper.get('.manager-profile-card__initials').text()).toBe('МИ');
  });
});
