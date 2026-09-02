<template>
  <div class="chat-recorder" :class="{ 'chat-recorder--active': active }">
    <div class="row items-center justify-end no-wrap q-gutter-xs">
      <q-btn
        v-if="state === 'idle' || state === 'error'"
        flat
        round
        dense
        :icon="mode === 'voice' ? 'videocam' : 'mic'"
        :disable="sending"
        :aria-label="label(mode === 'voice' ? 'switchToVideo' : 'switchToVoice')"
        @click="mode = mode === 'voice' ? 'video_note' : 'voice'"
      />
      <q-btn
        v-if="state !== 'preview'"
        data-testid="record"
        round
        unelevated
        :icon="
          state === 'recording' ? 'fiber_manual_record' : mode === 'voice' ? 'mic' : 'videocam'
        "
        :color="state === 'recording' ? 'negative' : 'primary'"
        :disable="sending"
        class="chat-recorder__hold"
        :aria-label="label(mode === 'voice' ? 'recordVoice' : 'recordVideo')"
        :aria-pressed="state === 'recording'"
        @pointerdown="beginHold"
        @pointermove="moveHold"
        @pointerup="endHold"
        @pointercancel="cancel"
        @contextmenu.prevent
        @click="keyboardStart"
      />
      <template v-if="active">
        <span v-if="state === 'requesting'" role="status" class="col text-caption">{{
          label('requesting')
        }}</span>
        <span
          v-else-if="state !== 'error'"
          class="col text-caption"
          :aria-label="label('duration')"
          >{{ duration }}</span
        >
        <q-icon v-if="locked && state === 'recording'" name="lock" :aria-label="label('locked')" />
        <q-btn
          v-if="state === 'recording'"
          data-testid="stop-recording"
          flat
          round
          icon="stop"
          :aria-label="label('stop')"
          @click="stop"
        />
        <q-btn
          flat
          round
          :icon="state === 'preview' ? 'delete_outline' : 'close'"
          :disable="sending"
          :aria-label="label(state === 'preview' ? 'delete' : 'cancel')"
          @click="cancel"
        />
        <q-btn
          v-if="state === 'preview'"
          data-testid="send-recording"
          round
          unelevated
          color="primary"
          icon="send"
          :loading="sending"
          :disable="sending"
          :aria-label="label('send')"
          @click="send"
        />
      </template>
    </div>
    <p v-if="state === 'recording' && !locked" class="text-caption q-ma-none q-pt-xs">
      {{ label('gestureHint') }}
    </p>
    <p v-if="state === 'recording' && locked" class="text-caption q-ma-none q-pt-xs" role="status">
      {{ label('locked') }}
    </p>
    <video
      v-if="state === 'recording' && mode === 'video_note'"
      :srcObject="stream"
      autoplay
      muted
      playsinline
      class="chat-recorder__video q-mt-sm"
      :aria-label="label('cameraPreview')"
    />
    <template v-if="state === 'preview'">
      <video
        v-if="kind === 'video_note'"
        :src="previewUrl"
        controls
        playsinline
        preload="metadata"
        class="chat-recorder__video q-mt-sm"
        :aria-label="label('videoPreview')"
      />
      <audio
        v-else
        :src="previewUrl"
        controls
        preload="metadata"
        class="chat-recorder__audio q-mt-sm"
        :aria-label="label('voicePreview')"
      />
    </template>
    <p v-if="state === 'error'" role="alert" class="text-negative text-caption q-ma-none q-pt-xs">
      {{ label(error) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatRecorder, type ChatRecordingKind } from '@/composables/useChatRecorder';

const props = defineProps<{ sending?: boolean }>();
const emit = defineEmits<{
  send: [file: File, kind: ChatRecordingKind];
  active: [active: boolean];
}>();
const { t } = useI18n();
/** Возвращает подпись из общего пространства локализации рекордера. */
const label = (key: string) => t(`manager.chat.recorder.${key}`);
const { state, kind, elapsedSeconds, error, file, stream, previewUrl, start, stop, reset } =
  useChatRecorder();
const mode = ref<ChatRecordingKind>('voice');
const locked = ref(false);
// Ошибка занимает всю ширину composer; закрытие возвращает сохранённый текстовый ввод.
const active = computed(() => state.value !== 'idle');
const duration = computed(
  () =>
    `${Math.floor(elapsedSeconds.value / 60)}:${String(elapsedSeconds.value % 60).padStart(2, '0')}`,
);
let pointer: { id: number; x: number; y: number } | null = null;

watch(active, (value) => emit('active', value), { immediate: true });

/** Отменяет жест и запись; также вызывается после подтверждённой отправки. */
function cancel() {
  pointer = null;
  locked.value = false;
  reset();
}
/** Начинает запись по удержанию и захватывает указатель для последующих жестов. */
function beginHold(event: PointerEvent) {
  if (event.button !== 0 || props.sending || !['idle', 'error'].includes(state.value)) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  locked.value = false;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  void start(mode.value);
}
/** Сдвиг влево отменяет запись, вверх фиксирует её до явной остановки. */
function moveHold(event: PointerEvent) {
  if (!pointer || pointer.id !== event.pointerId || locked.value) return;
  if (event.clientX - pointer.x <= -70) cancel();
  else if (event.clientY - pointer.y <= -70) locked.value = true;
}
/** Завершает незафиксированное удержание в предпросмотр без отправки. */
function endHold(event: PointerEvent) {
  if (!pointer || pointer.id !== event.pointerId) return;
  pointer = null;
  if (!locked.value) stop();
}
/** Активация клавиатурой или вспомогательной технологией запускает запись без удержания. */
function keyboardStart(event: MouseEvent) {
  if (event.detail !== 0 || props.sending || !['idle', 'error'].includes(state.value)) return;
  locked.value = true;
  void start(mode.value);
}
/** Передаёт готовый файл родителю, сохраняя его для повторной отправки при ошибке. */
function send() {
  if (file.value && state.value === 'preview' && !props.sending)
    emit('send', file.value, kind.value);
}
defineExpose({ reset: cancel });
</script>

<style scoped>
.chat-recorder {
  min-width: 0;
  flex-shrink: 0;
}
.chat-recorder--active {
  width: 100%;
  max-width: 100%;
}
.chat-recorder :deep(.q-btn) {
  min-width: 44px;
  min-height: 44px;
}
.chat-recorder__hold {
  touch-action: none;
  user-select: none;
}
.chat-recorder__video {
  display: block;
  width: min(100%, 200px);
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  margin-inline: auto;
  background: var(--antex-bg-deep);
}
.chat-recorder__audio {
  display: block;
  width: 100%;
}
</style>
