import { onScopeDispose, ref, shallowRef } from 'vue';

export type ChatRecordingKind = 'voice' | 'video_note';
export type ChatRecorderState = 'idle' | 'requesting' | 'recording' | 'preview' | 'error';
const MAX_BYTES = 20 * 1024 * 1024;
// Запас нужен для финального dataavailable: обрезать готовый медиаконтейнер нельзя.
const STOP_BYTES = MAX_BYTES - 1024 * 1024;
const MIME_TYPES = {
  voice: ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'],
  video_note: ['video/webm;codecs=vp8,opus', 'video/mp4', 'video/webm'],
};

/** Управляет записью и предпросмотром, освобождая устройства при завершении scope. */
export function useChatRecorder() {
  const state = ref<ChatRecorderState>('idle');
  const kind = ref<ChatRecordingKind>('voice');
  const elapsedSeconds = ref(0);
  const error = ref('');
  const file = shallowRef<File | null>(null);
  const stream = shallowRef<MediaStream | null>(null);
  const previewUrl = ref('');
  let recorder: MediaRecorder | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let generation = 0;
  let disposed = false;

  /** Останавливает устройства и таймер без удаления готовой записи. */
  function releaseHardware() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    stream.value?.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }

  /** Отменяет текущую сессию и запоздавшие разрешения, удаляет локальный предпросмотр. */
  function reset() {
    generation += 1;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      if (recorder.state !== 'inactive') recorder.stop();
      recorder = null;
    }
    releaseHardware();
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
    file.value = null;
    elapsedSeconds.value = 0;
    error.value = '';
    state.value = 'idle';
  }

  /** Освобождает ресурсы и сохраняет безопасный ключ локализованной ошибки. */
  function fail(key: string) {
    reset();
    error.value = key;
    state.value = 'error';
  }

  /** Завершает запись в предпросмотр либо отменяет ещё не выданное разрешение. */
  function stop() {
    if (state.value === 'requesting') {
      reset();
      return;
    }
    if (recorder?.state === 'recording') recorder.stop();
    releaseHardware();
  }

  /** Запрашивает выбранные устройства только после действия пользователя и начинает запись. */
  async function start(recordingKind: ChatRecordingKind) {
    if (disposed || !['idle', 'error'].includes(state.value)) return;
    reset();
    kind.value = recordingKind;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      fail('unsupported');
      return;
    }
    state.value = 'requesting';
    const request = generation;
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video:
          recordingKind === 'video_note'
            ? { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
            : false,
      });
      if (disposed || generation !== request) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.value = acquired;
      const mimeType = MIME_TYPES[recordingKind].find((type) =>
        MediaRecorder.isTypeSupported?.(type),
      );
      const options: MediaRecorderOptions = { audioBitsPerSecond: 64000 };
      if (mimeType) options.mimeType = mimeType;
      if (recordingKind === 'video_note') options.videoBitsPerSecond = 800000;
      const instance = new MediaRecorder(acquired, options);
      recorder = instance;
      const chunks: Blob[] = [];
      let bytes = 0;
      instance.ondataavailable = (event) => {
        if (generation !== request || !event.data.size) return;
        bytes += event.data.size;
        if (bytes > MAX_BYTES) {
          fail('tooLarge');
          return;
        }
        chunks.push(event.data);
        if (bytes >= STOP_BYTES) stop();
      };
      instance.onerror = () => {
        if (generation === request) fail('recordingFailed');
      };
      instance.onstop = () => {
        if (generation !== request) return;
        releaseHardware();
        recorder = null;
        if (!bytes) {
          fail('emptyRecording');
          return;
        }
        const type = instance.mimeType || chunks[0]?.type || mimeType || '';
        const extension = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
        file.value = new File(chunks, `${recordingKind}-${Date.now()}.${extension}`, { type });
        previewUrl.value = URL.createObjectURL(file.value);
        state.value = 'preview';
      };
      instance.start(250);
      state.value = 'recording';
      const startedAt = Date.now();
      const limit = recordingKind === 'video_note' ? 60 : 300;
      timer = setInterval(() => {
        elapsedSeconds.value = Math.min(limit, Math.floor((Date.now() - startedAt) / 1000));
        if (elapsedSeconds.value >= limit) stop();
      }, 250);
    } catch (cause) {
      if (disposed || generation !== request) return;
      const name = cause instanceof Error ? cause.name : '';
      fail(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'permissionDenied'
          : name === 'NotFoundError' || name === 'NotReadableError'
            ? 'deviceUnavailable'
            : 'recordingFailed',
      );
    }
  }

  onScopeDispose(() => {
    disposed = true;
    reset();
  });

  return {
    state,
    kind,
    elapsedSeconds,
    error,
    file,
    stream,
    previewUrl,
    start,
    stop,
    cancel: reset,
    reset,
  };
}
