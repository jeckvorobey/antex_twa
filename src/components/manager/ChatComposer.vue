<template>
  <div class="manager-chat-composer">
    <input ref="fileInput" type="file" class="manager-chat-composer__file-input" @change="onFileChange" />
    <q-btn
      flat
      round
      dense
      icon="add"
      aria-label="Прикрепить файл"
      :disable="sending"
      @click="fileInput?.click()"
    />
    <q-input
      v-model="text"
      borderless
      dense
      autogrow
      type="textarea"
      placeholder="Сообщение…"
      maxlength="4096"
      class="manager-chat-composer__input"
      @keydown.enter.exact.prevent="submit"
    />
    <q-btn
      round
      unelevated
      icon="send"
      class="manager-chat-composer__send"
      :loading="sending"
      :disable="!text.trim()"
      aria-label="Отправить"
      @click="submit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ sending?: boolean }>();
const emit = defineEmits<{
  send: [text: string];
  sendFile: [file: File];
}>();

const text = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

function submit(): void {
  const value = text.value.trim();
  if (!value || props.sending) {
    return;
  }
  emit('send', value);
  text.value = '';
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && !props.sending) {
    emit('sendFile', file);
  }
  input.value = '';
}
</script>
