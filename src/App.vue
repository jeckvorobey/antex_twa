<template>
  <router-view v-if="authStore.canUseApp" />
  <telegram-write-access-gate v-else />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import TelegramWriteAccessGate from '@components/auth/TelegramWriteAccessGate.vue';
import { useAuthStore } from '@stores/auth.store';
import { resolveWorkspaceRedirect } from '@utils/manager-workspace';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

watch(
  [() => authStore.ready, () => authStore.user?.role, () => route.path],
  ([ready, role, path]) => {
    if (!ready) {
      return;
    }
    const redirect = resolveWorkspaceRedirect(role, path);
    if (redirect) {
      void router.replace(redirect);
    }
  },
  { immediate: true },
);
</script>
