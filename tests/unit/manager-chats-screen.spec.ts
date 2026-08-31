import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { QAvatar, QBtn, QIcon, QImg, QInput, QSpinner, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';

import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import ManagerChatFilters from '@components/manager/ManagerChatFilters.vue';
import ManagerChatSearch from '@components/manager/ManagerChatSearch.vue';
import ru from '@i18n/ru';
import ManagerChatPage from '@pages/manager/ManagerChatPage.vue';
import ManagerProfilePage from '@pages/manager/ManagerProfilePage.vue';

const pagePath = resolve(process.cwd(), 'src/pages/manager/ManagerChatsPage.vue');
const itemPath = resolve(process.cwd(), 'src/components/manager/ConversationListItem.vue');
const searchPath = resolve(process.cwd(), 'src/components/manager/ManagerChatSearch.vue');
const filtersPath = resolve(process.cwd(), 'src/components/manager/ManagerChatFilters.vue');
const listPath = resolve(process.cwd(), 'src/components/manager/ManagerConversationList.vue');

const routerPush = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { conversationId: 'invalid' } }),
  useRouter: () => ({ push: routerPush }),
}));

describe('manager chats Penpot composition', () => {
  it('preserves search clear and boolean filter events', async () => {
    const global = { plugins: [Quasar], components: { QBtn, QIcon, QInput } };
    const search = mount(ManagerChatSearch, {
      props: { modelValue: 'Сергей', placeholder: 'Поиск' },
      global,
    });
    const input = search.getComponent(QInput);

    input.vm.$emit('update:modelValue', '2026080128');
    input.vm.$emit('update:modelValue', null);

    expect(search.emitted('update:modelValue')).toEqual([['2026080128'], ['']]);
    expect(search.emitted('search')).toHaveLength(2);

    const filters = mount(ManagerChatFilters, {
      props: {
        unreadOnly: false,
        allLabel: 'Все',
        unreadLabel: 'Непрочитанные',
        ariaLabel: 'Фильтр чатов',
      },
      global,
    });
    const buttons = filters.findAllComponents(QBtn);
    await buttons[0]!.trigger('click');
    await buttons[1]!.trigger('click');
    expect(filters.emitted('change')).toEqual([[false], [true]]);
  });

  it('delegates search, filters and repeated rows to reusable components', () => {
    const page = readFileSync(pagePath, 'utf8');

    expect(existsSync(searchPath)).toBe(true);
    expect(existsSync(filtersPath)).toBe(true);
    expect(existsSync(listPath)).toBe(true);
    expect(page).toContain('<AppHeaderBar');
    expect(page).toContain('<ManagerChatSearch');
    expect(page).toContain('<ManagerChatFilters');
    expect(page).toContain('<ManagerConversationList');
    expect(page).not.toContain('<ManagerPageHeader');
  });

  it('places the order number before client and preview like Conversation Row', () => {
    const item = readFileSync(itemPath, 'utf8');
    const orderIndex = item.indexOf('manager-conversation-item__order');
    const nameIndex = item.indexOf('manager-conversation-item__name');
    const previewIndex = item.indexOf('manager-conversation-item__preview');

    expect(orderIndex).toBeGreaterThan(-1);
    expect(orderIndex).toBeLessThan(nameIndex);
    expect(nameIndex).toBeLessThan(previewIndex);
  });

  it('allows only validated HTTPS avatar URLs in conversation rows', () => {
    const item = readFileSync(itemPath, 'utf8');

    expect(item).toContain("import { toSafeExternalUrl } from '@utils/safe-external-url';");
    expect(item).toContain(
      'const safePhotoUrl = computed(() => toSafeExternalUrl(props.conversation.user.photoUrl));',
    );
    expect(item).toContain('<img v-if="safePhotoUrl" :src="safePhotoUrl" alt="" />');
    expect(item).not.toContain(':src="conversation.user.photoUrl"');
  });

  it('keeps search out of rendered Chat Detail and connection state in one Profile location', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const global = {
      plugins: [
        pinia,
        Quasar,
        createI18n({ legacy: false, locale: 'ru', messages: { ru } }),
      ],
      components: { QAvatar, QBtn, QImg, QSpinner },
      stubs: {
        AppHeaderBar: true,
        AntexCard: { template: '<section><slot /></section>' },
        ChatComposer: true,
        ManagerPageHeader: { template: '<header><slot name="trailing" /></header>' },
        OrderCard: true,
        QPage: { template: '<main><slot /></main>' },
        ConnectionStatePill: { template: '<span class="connection-state-pill-stub" />' },
      },
    };

    const detail = mount(ManagerChatPage, { global });
    const profile = mount(ManagerProfilePage, { global });

    expect(detail.findComponent(ManagerChatSearch).exists()).toBe(false);
    expect(profile.findAllComponents(ConnectionStatePill)).toHaveLength(1);
  });
});
