import { mount } from '@vue/test-utils';
import { QBadge, QBtn, QCard, QSkeleton, Quasar } from 'quasar';
import { describe, expect, it } from 'vitest';

import AntexBadge from '@components/ui/AntexBadge.vue';
import AntexButton from '@components/ui/AntexButton.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import AntexSkeleton from '@components/ui/AntexSkeleton.vue';

const global = {
  plugins: [Quasar],
  components: { QBadge, QBtn, QCard, QSkeleton },
};

describe('Antex core primitives', () => {
  it('keeps the gold card contract on every surface variant', () => {
    const wrapper = mount(AntexCard, {
      props: { surface: 'deep', padded: true },
      slots: { default: 'Содержимое' },
      global,
    });

    expect(wrapper.classes()).toContain('antex-card');
    expect(wrapper.classes()).toContain('antex-card--deep');
    expect(wrapper.classes()).toContain('antex-card--padded');
    expect(wrapper.classes()).toContain('antex-card--gold-border');
    expect(wrapper.classes()).not.toContain('app-surface');
    expect(wrapper.classes()).not.toContain('antex-border-gold');
    expect(wrapper.text()).toBe('Содержимое');
  });

  it('forwards loading, disabled and accessible attributes to the real button', async () => {
    const wrapper = mount(AntexButton, {
      props: { loading: true, disable: true, variant: 'secondary' },
      attrs: { 'aria-label': 'Отправить заявку' },
      slots: { default: 'Отправить' },
      global,
    });

    expect(wrapper.get('button').attributes('aria-label')).toBe('Отправить заявку');
    expect(wrapper.get('button').attributes()).toHaveProperty('disabled');
    expect(wrapper.classes()).toContain('antex-button--secondary');
    expect(wrapper.find('.q-spinner').exists()).toBe(true);
  });

  it('exposes status meaning as text and a stable semantic tone', () => {
    const wrapper = mount(AntexBadge, {
      props: { tone: 'positive', kind: 'status', label: 'Завершена' },
      global,
    });

    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.classes()).toContain('antex-badge--positive');
    expect(wrapper.text()).toContain('Завершена');
  });

  it('renders order-card skeleton as non-announced visual placeholders', () => {
    const wrapper = mount(AntexSkeleton, {
      props: { preset: 'order-card' },
      global,
    });

    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.classes()).toContain('antex-skeleton--order-card');
    expect(wrapper.findAll('.q-skeleton').length).toBeGreaterThanOrEqual(4);
  });
});
