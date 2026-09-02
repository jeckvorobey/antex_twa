import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatRecorder } from '@/composables/useChatRecorder';

class RecorderMock {
  static instances: RecorderMock[] = [];
  static isTypeSupported = vi.fn((type: string) => type.includes('webm'));
  state = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType || 'audio/mp4';
    RecorderMock.instances.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['recording'], { type: this.mimeType }) });
    this.onstop?.();
  }
}
const scopes: ReturnType<typeof effectScope>[] = [];
let stopTrack: ReturnType<typeof vi.fn>;
let stream: MediaStream;
let getUserMedia: ReturnType<typeof vi.fn>;
function setup() {
  const scope = effectScope();
  scopes.push(scope);
  return { recorder: scope.run(() => useChatRecorder())!, scope };
}
beforeEach(() => {
  vi.useFakeTimers();
  stopTrack = vi.fn();
  stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
  getUserMedia = vi.fn().mockResolvedValue(stream);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.stubGlobal('MediaRecorder', RecorderMock);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:recording');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  RecorderMock.instances = [];
  RecorderMock.isTypeSupported.mockImplementation((type: string) => type.includes('webm'));
});
afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('useChatRecorder', () => {
  it('only requests hardware on start and only creates a preview after stop', async () => {
    const { recorder } = setup();
    expect(getUserMedia).not.toHaveBeenCalled();
    await recorder.start('voice');
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
    expect(recorder.state.value).toBe('recording');
    expect(recorder.file.value).toBeNull();
    vi.advanceTimersByTime(2100);
    expect(recorder.elapsedSeconds.value).toBe(2);
    recorder.stop();
    expect(recorder.state.value).toBe('preview');
    expect(recorder.file.value?.type).toBe('audio/webm;codecs=opus');
    expect(recorder.previewUrl.value).toBe('blob:recording');
    expect(stopTrack).toHaveBeenCalledTimes(1);
    recorder.reset();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recording');
    expect(recorder.file.value).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['cancel', 'unmount', 'release'] as const)(
    'disposes late permission after %s',
    async (action) => {
      let resolve!: (stream: MediaStream) => void;
      getUserMedia.mockReturnValue(
        new Promise<MediaStream>((done) => {
          resolve = done;
        }),
      );
      const { recorder, scope } = setup();
      const pending = recorder.start('video_note');
      expect(recorder.state.value).toBe('requesting');
      if (action === 'cancel') recorder.cancel();
      else if (action === 'release') recorder.stop();
      else scope.stop();
      resolve(stream);
      await pending;
      expect(stopTrack).toHaveBeenCalledTimes(1);
      expect(RecorderMock.instances).toHaveLength(0);
      expect(recorder.state.value).toBe('idle');
    },
  );
  it.each([
    ['video_note', 60],
    ['voice', 300],
  ] as const)('stops %s at duration limit', async (kind, seconds) => {
    const { recorder } = setup();
    await recorder.start(kind);
    vi.advanceTimersByTime(seconds * 1000);
    expect(recorder.state.value).toBe('preview');
    expect(recorder.elapsedSeconds.value).toBe(seconds);
    expect(vi.getTimerCount()).toBe(0);
    if (kind === 'video_note') {
      expect(getUserMedia).toHaveBeenCalledWith({
        audio: true,
        video: expect.objectContaining({ facingMode: 'user' }),
      });
      expect(recorder.file.value?.type).toBe('video/webm;codecs=vp8,opus');
    }
  });
  it('falls back to browser MIME and disposes preview on unmount', async () => {
    RecorderMock.isTypeSupported.mockReturnValue(false);
    const { recorder, scope } = setup();
    await recorder.start('voice');
    recorder.stop();
    expect(recorder.file.value?.type).toBe('audio/mp4');
    scope.stop();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recording');
  });
  it('returns a useful permission error', async () => {
    getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    const { recorder } = setup();
    await recorder.start('voice');
    expect(recorder.state.value).toBe('error');
    expect(recorder.error.value).toBe('permissionDenied');
    expect(recorder.file.value).toBeNull();
  });
  it('stops tracks and timers after recorder failure', async () => {
    const { recorder } = setup();
    await recorder.start('voice');
    RecorderMock.instances[0]!.onerror?.();
    expect(recorder.state.value).toBe('error');
    expect(recorder.error.value).toBe('recordingFailed');
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(recorder.file.value).toBeNull();
  });
  it('finishes a valid preview before the hard byte limit, including final recorder data', async () => {
    const { recorder } = setup();
    await recorder.start('voice');
    RecorderMock.instances[0]!.ondataavailable?.({
      data: new Blob([new Uint8Array(19 * 1024 * 1024)], { type: 'audio/webm' }),
    });
    expect(recorder.state.value).toBe('preview');
    expect(recorder.file.value?.size).toBe(19 * 1024 * 1024 + 'recording'.length);
    expect(recorder.file.value!.size).toBeLessThan(20 * 1024 * 1024);
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
  it('rejects oversized recording and releases hardware', async () => {
    const { recorder } = setup();
    await recorder.start('video_note');
    RecorderMock.instances[0]!.ondataavailable?.({
      data: new Blob([new Uint8Array(20 * 1024 * 1024 + 1)]),
    });
    expect(recorder.state.value).toBe('error');
    expect(recorder.error.value).toBe('tooLarge');
    expect(recorder.file.value).toBeNull();
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
});

// Рекордер в UI: события устройств подменены, реальные разрешения не запрашиваются.
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import ChatRecorder from '@/components/manager/ChatRecorder.vue';
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
const ButtonStub = defineComponent({
  props: ['disable', 'loading'],
  template: '<button :disabled="disable || loading"><slot /></button>',
});
function mountRecorder() {
  return mount(ChatRecorder, {
    global: { stubs: { QBtn: ButtonStub, QIcon: true, QSpinner: true } },
  });
}
describe('ChatRecorder', () => {
  it('keeps the recorder expanded on permission failure and allows closing back to text', async () => {
    getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    const wrapper = mountRecorder();
    await wrapper.get('[data-testid="record"]').trigger('click', { detail: 0 });
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('permissionDenied');
    expect(wrapper.emitted('active')?.at(-1)).toEqual([true]);
    await wrapper.get('[aria-label="manager.chat.recorder.cancel"]').trigger('click');
    expect(wrapper.emitted('active')?.at(-1)).toEqual([false]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    wrapper.unmount();
  });
  it('holds/releases into preview and retains the same file after unsuccessful sending', async () => {
    const wrapper = mountRecorder();
    const button = wrapper.get('[data-testid="record"]');
    await button.trigger('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
    await flushPromises();
    await button.trigger('pointerup', { pointerId: 1 });
    await flushPromises();
    expect(wrapper.emitted('send')).toBeUndefined();
    expect(wrapper.find('audio').exists()).toBe(true);
    await wrapper.get('[data-testid="send-recording"]').trigger('click');
    const first = wrapper.emitted('send')![0];
    await wrapper.setProps({ sending: true });
    await wrapper.setProps({ sending: false });
    await wrapper.get('[data-testid="send-recording"]').trigger('click');
    expect(wrapper.emitted('send')![1]).toEqual(first);
    expect(wrapper.emitted('active')).toContainEqual([true]);
    wrapper.unmount();
  });
  it('cancels with a left swipe and locks with an upward swipe', async () => {
    const wrapper = mountRecorder();
    const button = wrapper.get('[data-testid="record"]');
    await button.trigger('pointerdown', { pointerId: 1, button: 0, clientX: 120, clientY: 120 });
    await flushPromises();
    await button.trigger('pointermove', { pointerId: 1, clientX: 30, clientY: 120 });
    await button.trigger('pointerup', { pointerId: 1 });
    expect(wrapper.find('audio').exists()).toBe(false);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    await button.trigger('pointerdown', { pointerId: 2, button: 0, clientX: 120, clientY: 120 });
    await flushPromises();
    await button.trigger('pointermove', { pointerId: 2, clientX: 120, clientY: 30 });
    await button.trigger('pointerup', { pointerId: 2 });
    expect(wrapper.find('[data-testid="stop-recording"]').exists()).toBe(true);
    expect(wrapper.find('audio').exists()).toBe(false);
    await wrapper.get('[data-testid="stop-recording"]').trigger('click');
    expect(wrapper.find('audio').exists()).toBe(true);
    wrapper.unmount();
  });
  it('supports keyboard activation and explicit stop without auto-send', async () => {
    const wrapper = mountRecorder();
    await wrapper.get('[data-testid="record"]').trigger('click', { detail: 0 });
    await flushPromises();
    await wrapper.get('[data-testid="stop-recording"]').trigger('click');
    expect(wrapper.find('audio').exists()).toBe(true);
    expect(wrapper.emitted('send')).toBeUndefined();
    wrapper.unmount();
  });
});
