import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import ChatMediaPlayer from '@components/manager/ChatMediaPlayer.vue';
import ru from '@i18n/ru';

describe('плеер сообщений', () => {
  it('показывает кружочек как inline video и обновляет таймер по событию', async () => {
    const wrapper = mount(ChatMediaPlayer, {
      props: { src: 'blob:test', videoNote: true },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
        stubs: {
          QBtn: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          QSlider: true,
        },
      },
    });
    const video = wrapper.get('video');
    expect(video.attributes()).toHaveProperty('playsinline');
    Object.defineProperty(video.element, 'duration', { value: 25, configurable: true });
    Object.defineProperty(video.element, 'currentTime', {
      value: 12,
      writable: true,
      configurable: true,
    });
    await video.trigger('loadedmetadata');
    await video.trigger('timeupdate');
    expect(wrapper.text()).toContain('0:12');
    expect(wrapper.text()).toContain('0:25');
    wrapper.unmount();
  });

  it('показывает ошибку воспроизведения, не выдавая её за playing', async () => {
    const wrapper = mount(ChatMediaPlayer, {
      props: { src: 'blob:test' },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
        stubs: {
          QBtn: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          QSlider: true,
        },
      },
    });
    const audio = wrapper.get('audio').element;
    vi.spyOn(audio, 'play').mockRejectedValue(new Error('unsupported'));
    await wrapper.findAll('button')[0]!.trigger('click');
    expect(wrapper.text()).toContain('Не удалось воспроизвести запись');
    wrapper.unmount();
  });
});
