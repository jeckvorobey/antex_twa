<template>
  <q-dialog v-model="open" maximized :aria-label="alt" @hide="zoomed = false">
    <div class="chat-image-viewer column no-wrap" @contextmenu.stop>
      <div class="chat-image-viewer__toolbar row items-center justify-end no-wrap">
        <q-btn
          flat
          round
          :icon="zoomed ? 'zoom_out' : 'zoom_in'"
          :aria-label="
            t(zoomed ? 'manager.chat.attachment.fitImage' : 'manager.chat.attachment.zoomImage')
          "
          @click="zoomed = !zoomed"
        />
        <q-btn
          flat
          round
          icon="close"
          :aria-label="t('manager.chat.attachment.closeImage')"
          @click="open = false"
        />
      </div>
      <div
        class="chat-image-viewer__viewport col"
        :class="{ 'chat-image-viewer__viewport--zoomed': zoomed }"
      >
        <img :src="src" :alt="alt" class="chat-image-viewer__image" draggable="false" />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{ src: string; alt: string }>();
const open = defineModel<boolean>({ default: false });
const { t } = useI18n();
const zoomed = ref(false);
// Новый просмотр всегда начинается с целого изображения, без сохранённого увеличения.
watch(open, () => {
  zoomed.value = false;
});
</script>

<style scoped>
.chat-image-viewer {
  background: var(--antex-bg-deep);
  color: var(--antex-text-primary);
  padding: var(--antex-safe-area-top) var(--antex-safe-area-right) var(--antex-safe-area-bottom)
    var(--antex-safe-area-left);
}
.chat-image-viewer__toolbar {
  flex: 0 0 auto;
  min-height: 56px;
  padding: 4px 8px;
}
.chat-image-viewer__toolbar :deep(.q-btn) {
  min-width: 44px;
  min-height: 44px;
}
.chat-image-viewer__viewport {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
.chat-image-viewer__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.chat-image-viewer__viewport--zoomed .chat-image-viewer__image {
  width: 200%;
  height: auto;
  max-width: none;
}
</style>
