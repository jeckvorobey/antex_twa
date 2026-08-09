<template>
  <router-view v-if="authStore.canUseApp" />
  <telegram-write-access-gate v-else />
</template>

<script setup lang="ts">
import TelegramWriteAccessGate from '@components/auth/TelegramWriteAccessGate.vue';
import { useAuthStore } from '@stores/auth.store';

const authStore = useAuthStore();
</script>
