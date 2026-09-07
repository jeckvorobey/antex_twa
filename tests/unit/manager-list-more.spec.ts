import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import ManagerListMore from '@components/manager/ManagerListMore.vue';
import ru from '@i18n/ru';

describe('ленивая догрузка списка менеджера', () => {
  it('запрашивает страницу только по нажатию и позволяет повторить ошибку', async () => {
    const wrapper = mount(ManagerListMore, {
      props: { hasMore: true, loading: false, error: false },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
        stubs: {
          QBtn: {
            props: ['label', 'disable'],
            template: '<button :disabled="disable">{{ label }}</button>',
          },
        },
      },
    });
    expect(wrapper.emitted('load')).toBeUndefined();
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('load')).toHaveLength(1);
    await wrapper.setProps({ error: true });
    expect(wrapper.text()).toContain(ru.common.retry);
    await wrapper.setProps({ hasMore: false, error: false });
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
