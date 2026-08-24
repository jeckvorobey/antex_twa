import { flushPromises, mount } from '@vue/test-utils';
import { QBtn, QCard, QDialog, Quasar } from 'quasar';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AntexBottomSheet from '@components/ui/AntexBottomSheet.vue';
import { useAntexNotify } from '@/composables/useAntexNotify';

afterEach(() => vi.restoreAllMocks());

describe('Antex overlays and feedback', () => {
  it('provides an accessible bottom-sheet name and close contract', async () => {
    const wrapper = mount(AntexBottomSheet, {
      props: { modelValue: true, titleId: 'sheet-title', draggable: true },
      slots: {
        title: '<span id="sheet-title">Меню</span>',
        default: 'Содержимое',
      },
      global: { plugins: [Quasar], components: { QBtn, QCard, QDialog } },
      attachTo: document.body,
    });

    const dialog = wrapper.getComponent(QDialog);
    expect(dialog.props('position')).toBe('bottom');
    await flushPromises();
    expect(document.body.querySelector('.antex-bottom-sheet__handle')).not.toBeNull();
    await wrapper.setProps({ modelValue: false });
    expect(wrapper.props('modelValue')).toBe(false);
  });

  it('uses aria-label without rendering an empty visual title wrapper', async () => {
    const wrapper = mount(AntexBottomSheet, {
      props: { modelValue: true, ariaLabel: 'Отправить заявку' },
      slots: { default: 'Форма' },
      global: { plugins: [Quasar], components: { QBtn, QCard, QDialog } },
      attachTo: document.body,
    });

    await flushPromises();
    const surface = document.body.querySelector('.antex-bottom-sheet__surface');
    expect(surface?.getAttribute('aria-label')).toBe('Отправить заявку');
    expect(document.body.querySelector('.antex-bottom-sheet__title')).toBeNull();
  });

  it('normalizes Quasar Notify above bottom navigation and safe area', () => {
    const create = vi.fn();
    const { notify } = useAntexNotify(create);

    notify('negative', 'Не удалось выполнить действие');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'Не удалось выполнить действие',
        position: 'bottom',
        classes: 'antex-notify antex-notify--negative',
      }),
    );
  });
});
