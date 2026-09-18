import { mount } from '@vue/test-utils';
import { QBtn, QIcon, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';

import CancelOrderButton from '@components/orders/CancelOrderButton.vue';
import ru from '@i18n/ru';

const dialogState = vi.hoisted(() => ({
  create: vi.fn(),
  onOk: null as (() => void) | null,
}));

vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('quasar')>();
  return {
    ...actual,
    Dialog: {
      create: dialogState.create.mockImplementation(() => {
        const chain = {
          onOk: (callback: () => void) => {
            dialogState.onOk = callback;
            return chain;
          },
          onDismiss: () => chain,
          onCancel: () => chain,
        };
        return chain;
      }),
    },
  };
});

function mountButton(
  props: Partial<InstanceType<typeof CancelOrderButton>['$props']> = {},
  variant: 'icon' | 'outlined' = 'outlined',
) {
  const i18n = createI18n({ legacy: false, locale: 'ru', messages: { ru } });
  return mount(CancelOrderButton, {
    props: {
      label: 'Отменить заявку',
      dialogTitle: 'Отменить заявку?',
      dialogMessage: 'Заявка будет отменена.',
      okLabel: 'Отменить заявку',
      variant,
      ...props,
    },
    global: {
      plugins: [Quasar, i18n],
      components: { QBtn, QIcon },
      stubs: {
        QTooltip: { template: '<span class="test-tooltip"><slot /></span>' },
      },
    },
    attachTo: document.body,
  });
}

describe('CancelOrderButton', () => {
  it('opens the confirmation dialog and emits confirm only after ok', async () => {
    dialogState.create.mockClear();
    dialogState.onOk = null;
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(dialogState.create).toHaveBeenCalledTimes(1);
    const options = dialogState.create.mock.calls[0][0];
    expect(options.title).toBe('Отменить заявку?');
    expect(options.message).toBe('Заявка будет отменена.');
    expect(options.ok.label).toBe('Отменить заявку');
    expect(options.ok.color).toBe('negative');
    expect(wrapper.emitted('confirm')).toBeUndefined();

    dialogState.onOk?.();
    expect(wrapper.emitted('confirm')).toHaveLength(1);

    wrapper.unmount();
  });

  it('does not open the dialog while disabled', async () => {
    dialogState.create.mockClear();
    const wrapper = mountButton({ disable: true });

    await wrapper.get('button').trigger('click');

    expect(dialogState.create).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('renders the icon variant for card action rows', async () => {
    dialogState.create.mockClear();
    const wrapper = mountButton({}, 'icon');
    const button = wrapper.get('[aria-label="Отменить заявку"]');

    expect(button.classes()).toContain('order-card__action');

    await button.trigger('click');
    dialogState.onOk?.();

    expect(dialogState.create).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('confirm')).toHaveLength(1);

    wrapper.unmount();
  });
});
