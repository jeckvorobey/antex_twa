import { flushPromises, mount } from '@vue/test-utils';
import { QBtn, QIcon, QSkeleton, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatAttachmentCard from '@components/manager/ChatAttachmentCard.vue';
import { fetchManagerAttachment } from '@services/manager-chat';
import type { ChatAttachment } from '@types/manager-chat';
import ru from '@i18n/ru';

vi.mock('@services/manager-chat', () => ({ fetchManagerAttachment: vi.fn() }));

/** Монтирует настоящую карточку, исключая только портал/анимацию диалога. */
function setup(kind = 'photo', mimeType = 'image/jpeg') {
  const attachment: ChatAttachment = {
    id: 1,
    kind,
    mimeType,
    filename: 'screenshot.jpg',
    fileId: 'file',
    fileUniqueId: null,
    size: 100,
  };
  return mount(ChatAttachmentCard, {
    props: { attachment },
    global: {
      plugins: [Quasar, createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
      components: { QBtn, QIcon, QSkeleton },
      stubs: {
        QDialog: {
          name: 'QDialog',
          props: { modelValue: Boolean, maximized: Boolean },
          template: '<div v-if="modelValue" role="dialog"><slot /></div>',
        },
      },
    },
  });
}
beforeEach(() => {
  vi.mocked(fetchManagerAttachment).mockResolvedValue(new Blob(['image'], { type: 'image/jpeg' }));
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:photo');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('Chat image viewer', () => {
  it.each(['photo', 'document'])(
    'opens %s fullscreen, zooms and closes without reloading',
    async (kind) => {
      const wrapper = setup(kind);
      await flushPromises();
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      await wrapper.get('button[aria-label="Открыть изображение на весь экран"]').trigger('click');
      expect(wrapper.get('[role="dialog"] img').attributes('src')).toBe('blob:photo');
      expect(wrapper.getComponent({ name: 'QDialog' }).props('maximized')).toBe(true);
      await wrapper.get('[aria-label="Увеличить изображение"]').trigger('click');
      expect(wrapper.find('[aria-label="Вписать изображение в экран"]').exists()).toBe(true);
      await wrapper.get('[aria-label="Закрыть просмотр"]').trigger('click');
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      await wrapper.get('button[aria-label="Открыть изображение на весь экран"]').trigger('click');
      expect(wrapper.find('[aria-label="Увеличить изображение"]').exists()).toBe(true);
      expect(fetchManagerAttachment).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
      wrapper.unmount();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
    },
  );
  it('keeps ordinary documents downloadable', async () => {
    const wrapper = setup('document', 'application/pdf');
    await flushPromises();
    expect(wrapper.get('a[download]').attributes('href')).toBe('blob:photo');
    expect(wrapper.find('button').exists()).toBe(false);
    wrapper.unmount();
  });
  it('does not offer a viewer for unavailable media', async () => {
    vi.mocked(fetchManagerAttachment).mockRejectedValue(new Error('unavailable'));
    const wrapper = setup();
    await flushPromises();
    expect(wrapper.text()).toContain('Вложение недоступно');
    expect(wrapper.find('button').exists()).toBe(false);
    wrapper.unmount();
  });
});
