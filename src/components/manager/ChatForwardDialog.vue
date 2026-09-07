<template>
  <q-dialog v-model="open" :persistent="sending">
    <q-card class="manager-chat-forward">
      <q-card-section class="row items-center no-wrap">
        <div class="text-subtitle1 col">{{ t('manager.chat.forward.title') }}</div>
        <q-btn
          v-close-popup
          flat
          round
          icon="close"
          :disable="sending"
          :aria-label="t('common.close')"
        />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input
          v-model="query"
          dense
          outlined
          :debounce="250"
          :label="t('manager.chat.forward.search')"
          :disable="sending"
        />
        <div v-if="loading" class="text-center q-pa-md"><q-spinner color="primary" /></div>
        <div v-else-if="loadError" class="q-py-md">
          {{ t('manager.chat.forward.loadError') }}
          <q-btn flat no-caps :label="t('common.retry')" @click="load" />
        </div>
        <q-list
          v-else
          class="manager-chat-forward__list q-mt-sm"
          role="listbox"
          :aria-label="t('manager.chat.forward.title')"
        >
          <q-item
            v-for="conversation in conversations"
            :key="conversation.id"
            clickable
            :disable="sending"
            :active="selected?.id === conversation.id"
            role="option"
            :aria-selected="selected?.id === conversation.id"
            @click="selected = conversation"
          >
            <q-item-section>{{ name(conversation) }}</q-item-section>
            <q-item-section side
              ><q-icon v-if="selected?.id === conversation.id" name="check" color="primary"
            /></q-item-section>
          </q-item>
          <q-item v-if="!conversations.length"
            ><q-item-section>{{ t('manager.chat.forward.empty') }}</q-item-section></q-item
          >
          <q-btn
            v-if="hasMore"
            flat
            no-caps
            :label="t('manager.chat.forward.more')"
            :loading="loadingMore"
            @click="loadMore"
          />
        </q-list>
        <div v-if="selected" class="q-mt-md">
          {{ t('manager.chat.forward.confirm', { name: name(selected) }) }}
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps :disable="sending" :label="t('common.cancel')" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          text-color="black"
          :loading="sending"
          :disable="!selected || loading"
          :label="t('manager.chat.actions.forward')"
          @click="selected && emit('forward', selected.id)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchManagerChats } from '@services/manager-chat';
import { managerUserFullName } from '@utils/manager-chat';
import type { ManagerConversation } from '@types/manager-chat';

defineProps<{ sending?: boolean }>();
const emit = defineEmits<{ forward: [conversationId: number] }>();
const open = defineModel<boolean>({ default: false });
const { t } = useI18n();
const query = ref('');
const conversations = ref<ManagerConversation[]>([]);
const selected = ref<ManagerConversation | null>(null);
const loading = ref(false);
const loadingMore = ref(false);
const loadError = ref(false);
const hasMore = ref(false);
let generation = 0;
let controller: AbortController | undefined;

/** Возвращает имя получателя без зависимости от фильтров основной страницы. */
function name(conversation: ManagerConversation): string {
  return (
    managerUserFullName(conversation.user) ||
    t('manager.customerFallback', { id: conversation.user.id })
  );
}

/** Загружает актуальный поиск и не применяет устаревший ответ после закрытия. */
async function fetchPage(append = false): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  const current = ++generation;
  if (append) loadingMore.value = true;
  else {
    loading.value = true;
    selected.value = null;
  }
  loadError.value = false;
  try {
    const result = await fetchManagerChats(
      {
        query: query.value.trim() || undefined,
        limit: 50,
        offset: append ? conversations.value.length : 0,
      },
      { signal: controller.signal },
    );
    if (current !== generation || !open.value) return;
    conversations.value = append ? [...conversations.value, ...result.items] : result.items;
    hasMore.value = conversations.value.length < result.total;
  } catch {
    if (current === generation && open.value) loadError.value = true;
  } finally {
    if (current === generation) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}
/** Запускает поиск с первой страницы. */
function load(): void {
  void fetchPage();
}
/** Загружает следующую страницу получателей. */
function loadMore(): void {
  void fetchPage(true);
}
watch(
  [open, query],
  ([visible]) => {
    if (visible) load();
    else {
      ++generation;
      controller?.abort();
      selected.value = null;
      conversations.value = [];
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  ++generation;
  controller?.abort();
});
</script>
