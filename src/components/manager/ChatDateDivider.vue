<template>
  <div class="manager-chat-date-divider"><span>{{ label }}</span></div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<style scoped>
.manager-chat-date-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  color: var(--antex-text-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.manager-chat-date-divider::before,
.manager-chat-date-divider::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--antex-separator);
}

.manager-chat-date-divider span {
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--antex-bg-deep);
}
</style>
