<template>
  <button
    type="button"
    :class="['app-info-row', clickable ? 'app-info-row--clickable' : null]"
    :disabled="!clickable"
    @click="emit('click')"
  >
    <div class="app-info-row__icon">
      <q-icon :name="icon" size="18px" />
    </div>

    <div class="app-info-row__content">
      <div class="app-info-row__title">{{ title }}</div>
      <div v-if="subtitle" class="app-info-row__subtitle">{{ subtitle }}</div>
    </div>

    <div v-if="badge || value || clickable" class="app-info-row__meta">
      <div v-if="badge" :class="['app-status-pill', `app-status-pill--${badgeTone}`]">
        {{ badge }}
      </div>
      <div v-if="value" class="app-info-row__value">{{ value }}</div>
      <q-icon v-if="clickable" name="chevron_right" size="16px" class="app-info-row__chevron" />
    </div>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    title: string;
    subtitle?: string | null;
    value?: string | null;
    badge?: string | null;
    badgeTone?: 'positive' | 'warning' | 'negative' | 'info';
    clickable?: boolean;
  }>(),
  {
    subtitle: null,
    value: null,
    badge: null,
    badgeTone: 'positive',
    clickable: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();
</script>
