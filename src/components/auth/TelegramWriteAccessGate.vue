<template>
  <q-layout view="hhh lpr fff" class="bg-background">
    <q-page-container>
      <q-page class="flex flex-center q-pa-lg">
        <q-card flat bordered class="full-width" style="max-width: 420px">
          <q-card-section class="column items-center text-center q-gutter-md q-pa-xl">
            <q-avatar
              color="primary"
              text-color="white"
              size="64px"
              icon="notifications_active"
            />
            <div class="text-h5 text-weight-bold">{{ title }}</div>
            <div class="text-body1 text-grey-7">{{ message }}</div>
            <q-spinner v-if="busy" color="primary" size="36px" />
          </q-card-section>

          <q-card-actions v-if="!busy" vertical class="q-gutter-sm q-pa-lg q-pt-none">
            <q-btn
              color="primary"
              unelevated
              no-caps
              :label="retryLabel"
              @click="requestAccess"
            />
            <q-btn
              flat
              no-caps
              color="grey-7"
              :label="t('writeAccess.close')"
              @click="closeApp"
            />
          </q-card-actions>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { tg } from '@boot/telegram';
import { useAuthStore } from '@stores/auth.store';

const authStore = useAuthStore();
const { t } = useI18n();

const busy = computed(() => ['idle', 'requesting', 'syncing'].includes(authStore.writeAccessState));
const title = computed(() => t(`writeAccess.${authStore.writeAccessState}.title`));
const message = computed(() => t(`writeAccess.${authStore.writeAccessState}.text`));
const retryLabel = computed(() =>
  authStore.writeAccessState === 'auth_error'
    ? t('writeAccess.retryAuth')
    : authStore.writeAccessState === 'sync_error'
    ? t('writeAccess.retrySync')
    : t('writeAccess.retryPermission'),
);

async function requestAccess() {
  if (authStore.writeAccessState === 'auth_error') {
    await authStore.init();
    if (authStore.writeAccessState === 'auth_error') {
      return;
    }
  }
  await authStore.requestTelegramWriteAccess();
}

function closeApp() {
  tg?.close();
}

onMounted(() => {
  if (authStore.writeAccessState !== 'auth_error') {
    void requestAccess();
  }
});
</script>
