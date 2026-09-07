import { mount } from '@vue/test-utils';
import {
  QBanner,
  QBtn,
  QCard,
  QIcon,
  QItem,
  QItemLabel,
  QItemSection,
  Quasar,
} from 'quasar';
import { describe, expect, it } from 'vitest';

import AntexCell from '@components/ui/AntexCell.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import AntexNotice from '@components/ui/AntexNotice.vue';

const global = {
  plugins: [Quasar],
  components: { QBanner, QBtn, QCard, QIcon, QItem, QItemLabel, QItemSection },
};

describe('Antex structural primitives', () => {
  it('renders a static cell as content rather than a disabled button', () => {
    const wrapper = mount(AntexCell, {
      props: { title: 'Получатель', description: 'Иван Петров' },
      global,
    });

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.attributes()).not.toHaveProperty('disabled');
    expect(wrapper.text()).toContain('Получатель');
    expect(wrapper.text()).toContain('Иван Петров');
  });

  it('emits only from an explicitly clickable cell', async () => {
    const wrapper = mount(AntexCell, {
      props: { title: 'Открыть профиль', clickable: true },
      global,
    });

    expect(wrapper.element.tagName).toBe('BUTTON');
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('actually renders and emits a notice dismissal action', async () => {
    const wrapper = mount(AntexNotice, {
      props: { tone: 'warning', dismissible: true, dismissLabel: 'Закрыть' },
      slots: { title: 'Внимание', default: 'Проверьте реквизиты' },
      global,
    });

    expect(wrapper.attributes('role')).toBe('alert');
    await wrapper.get('[aria-label="Закрыть"]').trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('keeps an empty-state action accessible', async () => {
    const wrapper = mount(AntexEmptyState, {
      props: { title: 'Заявок нет', actionLabel: 'Создать заявку' },
      global,
    });

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });
});
