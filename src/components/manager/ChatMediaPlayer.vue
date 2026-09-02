<template>
  <div class="manager-chat-player" :class="{ 'manager-chat-player--circle': videoNote }">
    <component
      :is="videoNote ? 'video' : 'audio'"
      ref="media"
      :src="src"
      playsinline
      preload="metadata"
      :class="{ 'manager-chat-player__circle': videoNote }"
      :aria-label="t(videoNote ? 'manager.chat.preview.video_note' : 'manager.chat.preview.voice')"
      @loadedmetadata="update"
      @durationchange="update"
      @timeupdate="update"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
      @error="failed = true"
      @click="toggle"
    />
    <div class="row items-center no-wrap q-gutter-xs">
      <q-btn
        flat
        round
        :icon="playing ? 'pause' : 'play_arrow'"
        :aria-label="t(playing ? 'manager.chat.player.pause' : 'manager.chat.player.play')"
        @click="toggle"
      />
      <q-slider
        class="col"
        :model-value="position"
        :min="0"
        :max="duration || 1"
        :step="0.1"
        :disable="!duration"
        :aria-label="t('manager.chat.player.seek')"
        color="primary"
        @update:model-value="seek"
      />
      <q-btn
        flat
        dense
        no-caps
        :label="`${speed}×`"
        :aria-label="t('manager.chat.player.speed')"
        @click="changeSpeed"
      />
    </div>
    <div class="row justify-between text-caption">
      <span>{{ clock(position) }} / {{ clock(duration) }}</span>
    </div>
    <div v-if="failed" role="alert" class="text-caption text-negative">
      {{ t('manager.chat.player.error') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{ src: string; videoNote?: boolean }>();
const { t } = useI18n();
const media = ref<HTMLMediaElement | null>(null);
const position = ref(0);
const duration = ref(0);
const playing = ref(false);
const failed = ref(false);
const speed = ref(1);

/** Синхронизирует шкалу с фактическими media events, исключая Infinity/NaN. */
function update(): void {
  if (!media.value) return;
  position.value = Number.isFinite(media.value.currentTime) ? media.value.currentTime : 0;
  duration.value = Number.isFinite(media.value.duration) ? media.value.duration : 0;
}
/** Запускает воспроизведение явным действием и показывает отказ браузера. */
async function toggle(): Promise<void> {
  if (!media.value) return;
  failed.value = false;
  if (playing.value) media.value.pause();
  else {
    try {
      await media.value.play();
    } catch {
      failed.value = true;
      playing.value = false;
    }
  }
}
/** Перематывает в пределах известной длительности. */
function seek(value: number | null): void {
  if (media.value && value !== null)
    media.value.currentTime = Math.min(duration.value, Math.max(0, value));
}
/** Циклически переключает привычные скорости воспроизведения. */
function changeSpeed(): void {
  speed.value = speed.value === 1 ? 1.5 : speed.value === 1.5 ? 2 : 1;
  if (media.value) media.value.playbackRate = speed.value;
}
/** Форматирует длительность без зависимости от часового пояса. */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
onBeforeUnmount(() => media.value?.pause());
</script>
