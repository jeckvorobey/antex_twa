<template>
  <div
    class="manager-chat-bubble-row"
    :class="[
      `manager-chat-bubble-row--${message.direction}`,
      { 'manager-chat-bubble-row--group-end': groupEnd },
    ]"
  >
    <article
      ref="bubble"
      v-touch-hold:600="openMenu"
      class="manager-chat-bubble"
      :class="[
        `manager-chat-bubble--${message.direction}`,
        {
          'manager-chat-bubble--group-start': groupStart,
          'manager-chat-bubble--group-end': groupEnd,
        },
      ]"
      @contextmenu.prevent="openMenu"
    >
      <svg
        v-if="groupEnd"
        class="manager-chat-bubble__tail"
        viewBox="0 0 12 16"
        aria-hidden="true"
        focusable="false"
      >
        <path class="manager-chat-bubble__tail-fill" d="M9 0C9 8 6 12 1 15C4 16 8 16 12 15V0Z" />
        <path class="manager-chat-bubble__tail-edge" d="M9 0C9 8 6 12 1 15C4 16 8 16 12 15" />
      </svg>
      <div v-if="message.forwardSourceLabel" class="manager-chat-bubble__quote">
        {{ t('manager.chat.message.forwarded', { name: message.forwardSourceLabel }) }}
      </div>
      <div v-if="message.replyToMessageId" class="manager-chat-bubble__quote">
        {{ t('manager.chat.actions.reply') }}:
        {{ replyLabel || t('manager.chat.message.original') }}
      </div>
      <ChatAttachmentCard
        v-for="attachment in message.attachments"
        :key="attachment.id"
        :attachment="attachment"
      />
      <div v-if="content" class="manager-chat-bubble__text">{{ content }}</div>
      <div class="manager-chat-bubble__footer">
        <span v-if="message.edited">{{ t('manager.chat.message.edited') }}</span>
        <span>{{ time }}</span>
        <span v-if="message.direction === 'outbound'" class="manager-chat-bubble__delivery">
          <q-icon v-if="message.deliveryStatus === 'failed'" name="error_outline" size="14px" />
          <q-icon v-else-if="message.deliveryStatus === 'sent'" name="done" size="14px" />
          <q-spinner-dots v-else-if="message.deliveryStatus === 'pending'" size="14px" />
        </span>
      </div>
      <div v-if="message.deliveryStatus === 'failed'" class="manager-chat-bubble__failed">
        {{ t('manager.chat.message.failed') }}
      </div>
      <q-menu ref="menu" :target="bubble || undefined" no-parent-event>
        <q-list style="min-width: 180px">
          <q-item v-close-popup clickable :disable="!canReference" @click="emit('reply', message)"
            ><q-item-section avatar><q-icon name="reply" /></q-item-section
            ><q-item-section>{{ t('manager.chat.actions.reply') }}</q-item-section></q-item
          >
          <q-item v-close-popup clickable :disable="!canReference" @click="emit('forward', message)"
            ><q-item-section avatar><q-icon name="forward" /></q-item-section
            ><q-item-section>{{ t('manager.chat.actions.forward') }}</q-item-section></q-item
          >
          <q-item v-if="content" v-close-popup clickable @click="copy"
            ><q-item-section avatar><q-icon name="content_copy" /></q-item-section
            ><q-item-section>{{ t('manager.chat.actions.copy') }}</q-item-section></q-item
          >
        </q-list>
      </q-menu>
    </article>
    <q-btn
      flat
      round
      dense
      icon="more_horiz"
      class="manager-chat-bubble-actions"
      :aria-label="t('manager.chat.actions.menu')"
      @click="openMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { copyToClipboard, type QMenu } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAntexNotify } from '@/composables/useAntexNotify';

import ChatAttachmentCard from '@components/manager/ChatAttachmentCard.vue';
import type { ManagerChatMessage } from '@types/manager-chat';

const props = withDefaults(
  defineProps<{
    message: ManagerChatMessage;
    replyLabel?: string;
    groupStart?: boolean;
    groupEnd?: boolean;
  }>(),
  { groupStart: true, groupEnd: true },
);
const emit = defineEmits<{
  reply: [message: ManagerChatMessage];
  forward: [message: ManagerChatMessage];
}>();
const { locale, t } = useI18n();
const { notify } = useAntexNotify();
const bubble = ref<HTMLElement | null>(null);
const menu = ref<QMenu | null>(null);
const canReference = computed(
  () =>
    !!props.message.telegramMessageId &&
    ['sent', 'received'].includes(props.message.deliveryStatus),
);

/** Открывает одинаковые действия для клавиатуры, мыши и долгого нажатия. */
function openMenu(): void {
  menu.value?.show();
}
/** Копирует только видимый текст; отказ clipboard отображается локализованно. */
async function copy(): Promise<void> {
  try {
    await copyToClipboard(content.value || '');
    notify('positive', t('manager.chat.actions.copied'));
  } catch {
    notify('negative', t('manager.chat.actions.copyError'));
  }
}

const content = computed(() => props.message.text || props.message.caption);
const time = computed(() =>
  new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(
    Date.parse(props.message.createdAt),
  ),
);
</script>
