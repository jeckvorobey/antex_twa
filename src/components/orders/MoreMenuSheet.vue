<template>
  <AntexBottomSheet
    :model-value="modelValue"
    title-id="more-menu-title"
    content-class="q-pa-md"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #title>{{ t('more.title') }}</template>
    <div class="app-sheet__description">{{ t('more.subtitle') }}</div>

    <div class="column q-gutter-xs">
      <button
        v-for="item in menuItems"
        :key="item.id"
        type="button"
        class="app-sheet-menu-item"
        @click="handleAction(item)"
      >
        <div class="app-sheet-menu-item__left">
          <div class="app-sheet-menu-item__icon">
            <q-icon :name="item.icon" size="18px" />
          </div>
          <span>{{ item.title }}</span>
        </div>
        <q-icon name="chevron_right" size="16px" class="app-sheet-menu-item__chevron" />
      </button>
    </div>
  </AntexBottomSheet>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AntexBottomSheet from '@components/ui/AntexBottomSheet.vue';
import { useProfileStore } from '@stores/profile.store';
import type { MiniappMenuItem } from '@types/miniapp';
import { openSafeExternalUrl } from '@utils/safe-external-url';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const router = useRouter();
const profileStore = useProfileStore();

onMounted(async () => {
  if (!profileStore.data) {
    await profileStore.load();
  }
});

const menuItems = computed(() => profileStore.data?.menu ?? []);

function handleAction(item: MiniappMenuItem) {
  if (item.action === 'route' && item.route) {
    router.push(item.route);
    emit('update:modelValue', false);
    return;
  }

  if (item.action === 'link' && item.href) {
    openSafeExternalUrl(item.href);
    emit('update:modelValue', false);
    return;
  }

  emit('update:modelValue', false);
}
</script>
