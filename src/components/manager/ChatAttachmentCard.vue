<template>
  <div class="manager-chat-attachment">
    <q-skeleton v-if="loading" type="rect" class="manager-chat-attachment__skeleton" />
    <template v-else-if="objectUrl">
      <button
        v-if="isImage"
        type="button"
        class="manager-chat-attachment__open"
        :aria-label="t('manager.chat.attachment.openImage')"
        @click.stop="openImage"
      >
        <img
          :src="objectUrl"
          :alt="attachment.filename || t('manager.chat.attachment.photoAlt')"
          class="manager-chat-attachment__image"
        />
      </button>
      <ChatImageViewer
        v-if="isImage"
        v-model="imageOpen"
        :src="objectUrl"
        :alt="attachment.filename || t('manager.chat.attachment.photoAlt')"
      />
      <video
        v-else-if="attachment.kind === 'video' || attachment.kind === 'animation'"
        :src="objectUrl"
        controls
        playsinline
        preload="metadata"
        class="manager-chat-attachment__video"
      />
      <ChatMediaPlayer
        v-else-if="['voice', 'audio', 'video_note'].includes(attachment.kind)"
        :src="objectUrl"
        :video-note="attachment.kind === 'video_note'"
      />
      <a
        v-else
        :href="objectUrl"
        :download="attachment.filename || t('manager.chat.attachment.downloadName')"
        class="manager-chat-attachment__file"
      >
        <q-icon name="description" size="24px" />
        <span>
          <strong>{{ attachment.filename || t('manager.chat.attachment.document') }}</strong>
          <small v-if="sizeLabel">{{ sizeLabel }}</small>
        </span>
        <q-icon name="download" size="20px" />
      </a>
    </template>
    <div v-else class="manager-chat-attachment__error">
      <q-icon name="broken_image" size="22px" />
      <span>{{ t('manager.chat.attachment.unavailable') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { fetchManagerAttachment } from '@services/manager-chat';
import type { ChatAttachment } from '@types/manager-chat';
import { formatFileSize } from '@utils/manager-chat';
import ChatMediaPlayer from './ChatMediaPlayer.vue';
import ChatImageViewer from './ChatImageViewer.vue';

const props = defineProps<{ attachment: ChatAttachment }>();
const { t } = useI18n();

const loading = ref(true);
const imageOpen = ref(false);
const isImage = computed(
  () =>
    props.attachment.kind === 'photo' ||
    (['document', 'sticker'].includes(props.attachment.kind) &&
      props.attachment.mimeType?.startsWith('image/')),
);
/** Открывает загруженное изображение, не повторяя защищённый сетевой запрос. */
function openImage() {
  imageOpen.value = true;
}
const objectUrl = ref<string | null>(null);
let disposed = false;
const sizeLabel = computed(() =>
  formatFileSize(props.attachment.size, {
    kilobyte: t('manager.units.kilobyte'),
    megabyte: t('manager.units.megabyte'),
  }),
);

onMounted(async () => {
  try {
    const blob = await fetchManagerAttachment(props.attachment.id);
    if (disposed) return;
    objectUrl.value = URL.createObjectURL(blob);
  } catch {
    objectUrl.value = null;
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  disposed = true;
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>
