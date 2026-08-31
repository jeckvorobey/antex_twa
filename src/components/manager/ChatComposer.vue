<template>
  <div class="manager-chat-composer">
    <input ref="fileInput" type="file" class="manager-chat-composer__file-input" @change="onFileChange" />
    <q-btn
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
      v-model="text"
      borderless
      dense
      autogrow
      type="textarea"
      :placeholder="t('manager.chat.composer.placeholder')"
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
      :aria-label="t('manager.chat.composer.send')"
      @click="submit"
    >
      <q-tooltip>{{ t('manager.chat.composer.send') }}</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ sending?: boolean }>();
const { t } = useI18n();
const emit = defineEmits<{
  send: [text: string];
  sendFile: [file: File];
}>();

const text = defineModel<string>({ default: '' });
const fileInput = ref<HTMLInputElement | null>(null);

function submit(): void {
  const value = text.value.trim();
  if (!value || props.sending) {
    return;
  }
  emit('send', value);
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
