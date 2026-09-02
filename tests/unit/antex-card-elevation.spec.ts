import { mount } from '@vue/test-utils';
import { QCard, Quasar } from 'quasar';
import { describe, expect, it } from 'vitest';

import AntexCard from '@components/ui/AntexCard.vue';

describe('AntexCard elevation', () => {
  it('отключает стандартную тень Quasar при elevated=false и восстанавливает её при включении', async () => {
    const wrapper = mount(AntexCard, {
      props: { elevated: false },
      global: { plugins: [Quasar], components: { QCard } },
    });

    expect(wrapper.getComponent(QCard).props('flat')).toBe(true);
    await wrapper.setProps({ elevated: true });
    expect(wrapper.getComponent(QCard).props('flat')).toBe(false);
  });
});
