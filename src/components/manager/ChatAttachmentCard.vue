<template>
  <div class="manager-chat-attachment">
    <q-skeleton v-if="loading" type="rect" class="manager-chat-attachment__skeleton" />
    <template v-else-if="objectUrl">
      <img
        v-if="attachment.kind === 'photo'"
        :src="objectUrl"
        :alt="attachment.filename || t('manager.chat.attachment.photoAlt')"
        class="manager-chat-attachment__image"
      />
      <video
        v-else-if="attachment.kind === 'video'"
        :src="objectUrl"
        controls
        preload="metadata"
        class="manager-chat-attachment__video"
      />
      <audio
        v-else-if="attachment.kind === 'voice'"
        :src="objectUrl"
        controls
        preload="metadata"
        class="manager-chat-attachment__audio"
        :aria-label="t('manager.chat.attachment.voicePlayer')"
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

const props = defineProps<{ attachment: ChatAttachment }>();
const { t } = useI18n();

const loading = ref(true);
const objectUrl = ref<string | null>(null);
const sizeLabel = computed(() =>
  formatFileSize(props.attachment.size, {
    kilobyte: t('manager.units.kilobyte'),
    megabyte: t('manager.units.megabyte'),
  }),
);

onMounted(async () => {
  try {
    const blob = await fetchManagerAttachment(props.attachment.id);
    objectUrl.value = URL.createObjectURL(blob);
  } catch {
    objectUrl.value = null;
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>
