<template>
  <q-page class="manager-page">
    <ManagerPageHeader title="Профиль" subtitle="Рабочее пространство менеджера">
      <template #trailing>
        <ConnectionStatePill :state="realtimeStore.state" />
      </template>
    </ManagerPageHeader>

    <section class="manager-profile-card">
      <div class="manager-profile-card__avatar">{{ initials }}</div>
      <div>
        <div class="manager-profile-card__name">{{ displayName }}</div>
        <div class="manager-profile-card__role">Менеджер AntEx</div>
      </div>
    </section>

    <div class="manager-info-stack">
      <section class="manager-info-card">
        <div class="manager-info-card__label">Realtime</div>
        <ConnectionStatePill :state="realtimeStore.state" />
        <div class="manager-info-card__text">
          Новые сообщения, прочтение и счётчики обновляются через WebSocket без периодического polling.
        </div>
      </section>

      <section class="manager-info-card">
        <div class="manager-info-card__label">Уведомления</div>
        <div class="manager-info-card__text">
          Пока Mini App открыта, сообщения появляются здесь мгновенно. Если приложение закрыто, бот отправит
          Telegram-уведомление менеджеру.
        </div>
      </section>

      <section v-if="authStore.user?.username" class="manager-info-card">
        <div class="manager-info-card__label">Telegram</div>
        <div class="manager-info-card__text">@{{ authStore.user.username }}</div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import { useAuthStore } from '@stores/auth.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const authStore = useAuthStore();
const realtimeStore = useManagerRealtimeStore();

const displayName = computed(() => {
  const user = authStore.user;
  if (!user) {
    return 'Менеджер';
  }
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Менеджер';
});

const initials = computed(() => {
  const value = displayName.value.replace('@', '').trim();
  const parts = value.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
});
</script>
