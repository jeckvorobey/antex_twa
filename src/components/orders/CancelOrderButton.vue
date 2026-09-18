<template>
  <q-btn
    v-if="variant === 'icon'"
    flat
    round
    padding="0"
    class="order-card__action"
    :aria-label="label"
    :disable="disable"
    :loading="loading"
    @click.stop="openDialog"
  >
    <span class="order-card__action-visual">
      <q-icon
        :name="icon"
        size="var(--antex-space-md)"
        class="order-card__action-icon"
        aria-hidden="true"
      />
    </span>
    <q-tooltip>{{ label }}</q-tooltip>
  </q-btn>
  <q-btn
    v-else
    outline
    rounded
    no-caps
    color="negative"
    :icon="icon"
    :label="label"
    :disable="disable"
    :loading="loading"
    @click="openDialog"
  />
</template>

<script setup lang="ts">
import { Dialog } from 'quasar';
import { useI18n } from 'vue-i18n';
import { symOutlinedClose } from '@quasar/extras/material-symbols-outlined';

export type CancelOrderButtonVariant = 'icon' | 'outlined';

const props = withDefaults(
  defineProps<{
    label: string;
    dialogTitle: string;
    dialogMessage: string;
    okLabel: string;
    cancelLabel?: string;
    variant?: CancelOrderButtonVariant;
    icon?: string;
    loading?: boolean;
    disable?: boolean;
  }>(),
  {
    variant: 'outlined',
    icon: symOutlinedClose,
    cancelLabel: undefined,
    loading: false,
    disable: false,
  },
);

const emit = defineEmits<{
  confirm: [];
}>();

const { t } = useI18n();

/** Отмена выполняется только после подтверждения в модальном диалоге. */
let dialogOpen = false;

function openDialog(): void {
  if (dialogOpen || props.disable || props.loading) return;
  dialogOpen = true;
  Dialog.create({
    title: props.dialogTitle,
    message: props.dialogMessage,
    cancel: { label: props.cancelLabel ?? t('common.back'), flat: true },
    ok: { label: props.okLabel, color: 'negative' },
    persistent: true,
  })
    .onOk(() => emit('confirm'))
    .onDismiss(() => {
      dialogOpen = false;
    });
}
</script>
