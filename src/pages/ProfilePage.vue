<template>
  <q-page class="app-page q-pt-md">
    <div class="app-page__content">
      <div class="column items-center q-gutter-sm">
        <div
          class="row items-center justify-center"
          style="width: 80px; height: 80px; border-radius: 999px; background: var(--antex-gold-gradient); color: var(--antex-bg-primary);"
        >
          <q-icon name="person_outline" size="34px" />
        </div>
        <div class="text-h5 text-weight-bold">{{ profileStore.data?.user.displayName }}</div>
        <div class="app-secondary-text text-body2">
          {{ profileStore.data?.user.username ? `@${profileStore.data.user.username}` : t('common.brand') }}
        </div>
      </div>

      <AppSurface padded>
        <div class="column">
          <q-btn
            v-for="item in profileStore.data?.menu ?? []"
            :key="item.id"
            flat
            no-caps
            class="row items-center justify-between q-py-md"
            style="border-bottom: 1px solid rgba(212, 175, 55, 0.08);"
            @click="handleMenu(item)"
          >
            <div class="row items-center q-gutter-sm">
              <div
                class="row items-center justify-center"
                style="width: 36px; height: 36px; border-radius: 10px; background: rgba(212, 175, 55, 0.08);"
              >
                <q-icon :name="item.icon" color="primary" size="18px" />
              </div>
              <span>{{ item.title }}</span>
            </div>
            <q-icon name="chevron_right" color="grey-6" />
          </q-btn>
        </div>
      </AppSurface>

      <div class="app-muted text-center">
        {{ t('profile.version', { version: profileStore.data?.version ?? '1.0.0' }) }}
      </div>

      <q-inner-loading :showing="profileStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppSurface from '@components/ui/AppSurface.vue';
import { useProfileStore } from '@stores/profile.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappMenuItem } from '@types/miniapp';

const router = useRouter();
const uiStore = useUiStore();
const profileStore = useProfileStore();
const { t } = useI18n();

onMounted(async () => {
  if (!profileStore.data) {
    await profileStore.load();
  }
});

function handleMenu(item: MiniappMenuItem) {
  if (item.action === 'route' && item.route) {
    router.push(item.route);
    return;
  }

  if (item.action === 'link' && item.href) {
    window.open(item.href, '_blank');
    return;
  }

  uiStore.openMoreSheet();
}
</script>
