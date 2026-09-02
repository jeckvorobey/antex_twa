<template>
  <div
    ref="shell"
    class="manager-chat-composer"
    :class="{ 'manager-chat-composer--recording': recordingActive }"
  >
    <div v-if="replyLabel" class="manager-chat-composer__reply row items-center no-wrap">
      <q-icon name="reply" size="20px" />
      <span class="col ellipsis">{{ t('manager.chat.actions.reply') }}: {{ replyLabel }}</span>
      <q-btn
        flat
        round
        dense
        icon="close"
        :disable="sending"
        :aria-label="t('manager.chat.actions.cancelReply')"
        @click="emit('cancelReply')"
      />
    </div>
    <div class="manager-chat-composer__row row items-end no-wrap full-width">
      <input
        ref="fileInput"
        type="file"
        class="manager-chat-composer__file-input"
        @change="onFileChange"
      />
      <q-btn
        v-show="!recordingActive"
        flat
        round
        dense
        icon="add"
        class="manager-chat-composer__attach"
        :aria-label="t('manager.chat.composer.attach')"
        :disable="sending"
        @click="fileInput?.click()"
      >
        <q-tooltip>{{ t('manager.chat.composer.attach') }}</q-tooltip>
      </q-btn>
      <q-input
        v-show="!recordingActive"
        v-model="text"
        borderless
        dense
        autogrow
        type="textarea"
        :placeholder="t('manager.chat.composer.placeholder')"
        maxlength="4096"
        class="manager-chat-composer__input"
        :disable="sending"
        :aria-label="t('manager.chat.composer.placeholder')"
        @keydown.enter.exact="onEnter"
      />
      <ChatRecorder
        v-show="!text.trim() || recordingActive"
        ref="recorder"
        :sending="sending"
        @active="recordingActive = $event"
        @send="(file, kind) => emit('sendRecording', file, kind)"
      />
      <q-btn
        v-if="text.trim() && !recordingActive"
        round
        unelevated
        icon="send"
        class="manager-chat-composer__send"
        :loading="sending"
        :disable="!text.trim()"
        :aria-label="t('manager.chat.composer.send')"
        @click="submit"
      >
        <q-tooltip>{{ t('manager.chat.composer.send') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ChatRecorder from './ChatRecorder.vue';

const props = defineProps<{ sending?: boolean; replyLabel?: string }>();
const { t } = useI18n();
const emit = defineEmits<{
  send: [text: string];
  sendFile: [file: File];
  sendRecording: [file: File, kind: 'voice' | 'video_note'];
  cancelReply: [];
  height: [height: number];
}>();

const text = defineModel<string>({ default: '' });
const fileInput = ref<HTMLInputElement | null>(null);
const recorder = ref<InstanceType<typeof ChatRecorder> | null>(null);
const recordingActive = ref(false);
const shell = ref<HTMLElement | null>(null);
let observer: ResizeObserver | undefined;

onMounted(() => {
  if (shell.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver((entries) => {
      const height = entries[0]?.borderBoxSize?.[0]?.blockSize ?? shell.value?.offsetHeight;
      if (height) emit('height', height);
    });
    observer.observe(shell.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

/** Очищает запись только после подтверждённой доставки родительской страницей. */
function resetRecording(): void {
  recorder.value?.reset();
}
defineExpose({ resetRecording });

/** Enter отправляет текст, но не прерывает ввод через IME; Shift+Enter оставляет перенос. */
function onEnter(event: KeyboardEvent): void {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  submit();
}

/** Передаёт непустой draft родителю без преждевременной очистки. */
function submit(): void {
  const value = text.value.trim();
  if (!value || props.sending) {
    return;
  }
  emit('send', value);
}

/** Передаёт выбранный файл родителю, который хранит его до подтверждённой отправки. */
function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && !props.sending) {
    emit('sendFile', file);
  }
  input.value = '';
}
</script>
