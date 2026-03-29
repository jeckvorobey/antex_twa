<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    class="app-dialog--bottom"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <AppSurface class="app-sheet q-pa-md">
      <div class="app-sheet-handle" />
      <div class="app-sheet__title">{{ t('more.title') }}</div>
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
    </AppSurface>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppSurface from '@components/ui/AppSurface.vue';
import { useProfileStore } from '@stores/profile.store';
import type { MiniappMenuItem } from '@types/miniapp';

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
    window.open(item.href, '_blank');
    emit('update:modelValue', false);
    return;
  }

  emit('update:modelValue', false);
}
</script>
