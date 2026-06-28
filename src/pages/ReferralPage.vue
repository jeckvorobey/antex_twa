<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--referral">
      <!-- Balance hero -->
      <AexBalanceCard
        class="app-referral-balance-card"
        :balance="availableBalance"
        :label="t('referral.balanceLabel')"
      />

      <div v-if="reservedBalance > 0" class="app-referral-reserved">
        {{ t('referral.reserved') }}: {{ formatAexAmount(reservedBalance) }} AEX
      </div>

      <!-- Referral link card -->
      <AppSurface padded class="app-referral-link-card">
        <div class="app-referral-link-card__link-label text-caption text-grey-7 q-mb-xs">
          {{ t('referral.referralLinkLabel') }}
        </div>
        <q-input
          :model-value="referralLink"
          readonly
          dense
          outlined
          color="warning"
          class="app-referral-link-card__link-input"
        >
          <template #append>
            <q-btn
              round
              flat
              dense
              icon="content_copy"
              color="warning"
              size="sm"
              :aria-label="t('referral.copyLink')"
              @click="copyLink"
            />
          </template>
        </q-input>

        <div class="q-mt-md">
          <AppButton block color="warning" icon="share" @click="shareLink">
            {{ t('referral.share') }}
          </AppButton>
        </div>
      </AppSurface>

      <!-- Referrals info block -->
      <AppSurface padded class="app-referral-info-card justify-between">
        <div class="app-referral-info-card__header row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <q-icon name="group_add" color="warning" size="22px" class="q-mr-sm" />
            <span class="app-referral-info-card__title">{{ t('referral.invited') }}</span>
          </div>

          <div v-if="aexStore.totalReferrals > 0" class="app-referral-info-card__header-count">
            {{ aexStore.totalReferrals }}
          </div>
        </div>

        <AppSurface v-if="aexStore.referralLoading" class="q-pa-md q-mt-sm">
          <div class="row justify-center">
            <q-spinner-dots color="warning" size="24px" />
          </div>
        </AppSurface>

        <div
          v-else-if="aexStore.referralLoaded && aexStore.totalReferrals === 0"
          class="app-referral-info-card__empty q-mt-sm"
        >
          {{ t('referral.noReferrals') }}
        </div>
      </AppSurface>

      <!-- How it works instruction -->
      <AppSurface padded class="app-referral-instruction">
        <div class="text-weight-bold text-subtitle2 q-mb-sm">{{ t('referral.howItWorks') }}</div>
        <div class="row q-col-gutter-sm">
          <div
            v-for="step in instructionSteps"
            :key="step.title"
            class="col-12 col-sm"
          >
            <div class="app-referral-step-card q-pa-sm">
              <div class="row items-center no-wrap">
                <q-icon :name="step.icon" color="warning" size="22px" class="q-mr-sm" />
                <div class="text-weight-medium">{{ step.title }}</div>
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">{{ step.description }}</div>
            </div>
          </div>
        </div>
      </AppSurface>

      <AppSurface padded class="app-referral-terms">
        <div class="text-weight-bold text-subtitle2 q-mb-sm">{{ t('referral.termsTitle') }}</div>
        <div class="row q-col-gutter-sm">
          <div v-for="term in programTerms" :key="term.label" class="col-6">
            <div class="app-referral-term q-pa-sm">
              <div class="text-caption text-grey-6">{{ term.label }}</div>
              <div class="app-referral-term__value q-mt-xs">{{ term.value }}</div>
            </div>
          </div>
        </div>
      </AppSurface>

      <!-- Transaction history -->
      <div>
        <div class="row items-center q-mb-sm">
          <div class="app-section-label col">{{ t('referral.history') }}</div>
          <q-btn
            round
            flat
            dense
            icon="refresh"
            color="warning"
            size="sm"
            :aria-label="t('referral.refresh')"
            :loading="aexStore.txRefreshing"
            @click="refreshTx"
          />
        </div>

        <div ref="txScrollRef" class="app-referral-tx-scroll">
          <AppSurface v-if="transactions.length" class="app-referral-tx-list">
            <div
              v-for="tx in transactions"
              :key="tx.id"
              class="app-referral-tx-item"
            >
              <div class="app-referral-tx-item__info">
                <div class="app-referral-tx-item__desc">
                  <q-icon
                    :name="txTypeIcon(tx.type)"
                    :color="txTypeColor(tx.type)"
                    size="16px"
                    class="q-mr-xs"
                  />
                  {{ txTypeLabel(tx.type) }}
                </div>
                <div v-if="tx.description" class="app-referral-tx-item__detail">{{ tx.description }}</div>
                <div class="app-referral-tx-item__date">{{ formatDate(tx.createdAt) }}</div>
              </div>
              <div
                :class="[
                  'app-referral-tx-item__amount',
                  tx.amount >= 0 ? 'text-positive' : 'text-negative',
                ]"
              >
                {{ tx.amount >= 0 ? '+' : '' }}{{ formatAexAmount(tx.amount) }}
              </div>
            </div>
          </AppSurface>

          <AppSurface
            v-else-if="!aexStore.txLoading && aexStore.txLoaded"
            class="app-referral-tx-empty q-pa-md"
          >
            <div class="app-empty-state">{{ t('referral.noTransactions') }}</div>
          </AppSurface>

          <q-infinite-scroll
            v-if="aexStore.txHasMore"
            ref="infiniteScrollRef"
            :scroll-target="txScrollRef"
            :offset="120"
            :disable="aexStore.txLoading || aexStore.txRefreshing"
            @load="loadMore"
          >
            <template #loading>
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="warning" size="32px" />
              </div>
            </template>
          </q-infinite-scroll>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Notify } from 'quasar';

import AexBalanceCard from '@components/ui/AexBalanceCard.vue';
import AppButton from '@components/ui/AppButton.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useAexStore } from '@stores/aex.store';
import { formatMiniappDateTime } from '@utils/formatters';

const { locale, t } = useI18n();
const aexStore = useAexStore();

const infiniteScrollRef = ref<{ resume: () => void; stop: () => void } | null>(null);
const txScrollRef = ref<HTMLElement | null>(null);
const fallbackProgramConfig = {
  referralPercent: '0',
  referralMinWithdraw: '0',
  referralMaxWithdraw: null,
  aexRate: '0',
};

const availableBalance = computed(() => {
  const b = aexStore.balance;
  if (!b) return 0;
  // Show total unpaid balance (available + reserved)
  return b.totalEarned;
});

const reservedBalance = computed(() => {
  const b = aexStore.balance;
  if (!b) return 0;
  return Math.max(0, b.totalEarned - b.totalWithdrawn - b.available);
});

const referralLink = computed(() => aexStore.referralInfo?.referralLink ?? '');
const transactions = computed(() => aexStore.transactions ?? []);
const programConfig = computed(() => aexStore.referralInfo?.programConfig ?? fallbackProgramConfig);
const referralPercentValue = computed(() => parseDecimal(programConfig.value.referralPercent));
const programTerms = computed(() => [
  {
    label: t('referral.terms.referralPercent'),
    value: formatPercent(referralPercentValue.value),
  },
  {
    label: t('referral.terms.referralMinWithdraw'),
    value: `${formatAexAmount(parseDecimal(programConfig.value.referralMinWithdraw))} AEX`,
  },
  {
    label: t('referral.terms.referralMaxWithdraw'),
    value: programConfig.value.referralMaxWithdraw === null
      ? t('referral.noLimit')
      : `${formatAexAmount(parseDecimal(programConfig.value.referralMaxWithdraw))} AEX`,
  },
  {
    label: t('referral.terms.aexRate'),
    value: t('referral.aexRateValue', { rate: formatAexAmount(parseDecimal(programConfig.value.aexRate)) }),
  },
]);
const instructionSteps = computed(() => [
  {
    icon: 'share',
    title: t('referral.instructionStep1'),
    description: t('referral.instructionStep1Description'),
  },
  {
    icon: 'person_add',
    title: t('referral.instructionStep2'),
    description: t('referral.instructionStep2Description'),
  },
  {
    icon: 'currency_exchange',
    title: t('referral.instructionStep3'),
    description: t('referral.instructionStep3Description'),
  },
  {
    icon: 'card_giftcard',
    title: t('referral.instructionStep4'),
    description: t('referral.instructionStep4Description'),
  },
  {
    icon: 'account_balance_wallet',
    title: t('referral.instructionStep5'),
    description: t('referral.instructionStep5Description'),
  },
]);

onMounted(async () => {
  const tasks: Promise<void>[] = [];

  if (!aexStore.referralLoaded) {
    tasks.push(aexStore.loadReferral());
  }

  if (!aexStore.txLoaded || !transactions.value.length) {
    tasks.push(aexStore.loadFirstPage());
  }

  // Load wallet balance directly from AEX API
  tasks.push(aexStore.loadWallet());

  await Promise.all(tasks);
});

async function loadMore(_: number, done: (stop?: boolean) => void) {
  await aexStore.loadNextPage();
  done(!aexStore.txHasMore);
}

async function refreshTx() {
  await aexStore.refreshTransactions();
  infiniteScrollRef.value?.resume();
}

function copyLink() {
  if (referralLink.value) {
    void navigator.clipboard.writeText(referralLink.value);
    Notify.create({ type: 'positive', message: t('referral.linkCopied') });
  }
}

function shareLink() {
  if (!referralLink.value) {
    return;
  }

  const tg = window.Telegram?.WebApp;
  if (tg) {
    // Use Telegram's built-in share
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink.value)}&text=${encodeURIComponent(t('referral.shareText'))}`;
    window.open(shareUrl, '_blank');
  } else {
    void navigator.clipboard.writeText(referralLink.value);
  }
}

function formatDate(value: string) {
  return formatMiniappDateTime(value, locale.value);
}

function formatAexAmount(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString(locale.value);
  }
  return value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDecimal(value: string | null): number {
  if (value === null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value: number): string {
  return `${formatAexAmount(value)}%`;
}

function txTypeLabel(type: string): string {
  const key = `referral.txType.${type}`;
  const translated = t(key);
  return translated !== key ? translated : type;
}

function txTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    referral_reward: 'card_giftcard',
    withdrawal: 'arrow_downward',
    bonus: 'star',
    adjustment: 'tune',
  };
  return icons[type] ?? 'swap_horiz';
}

function txTypeColor(type: string): string {
  const colors: Record<string, string> = {
    referral_reward: 'positive',
    withdrawal: 'negative',
    bonus: 'warning',
    adjustment: 'info',
  };
  return colors[type] ?? 'grey';
}
</script>
