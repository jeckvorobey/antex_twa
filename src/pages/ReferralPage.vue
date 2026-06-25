<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--referral">
      <!-- Balance hero -->
      <AexBalanceCard :balance="availableBalance" />

      <div v-if="reservedBalance > 0" class="app-referral-reserved">
        {{ t('referral.reserved') }}: {{ formatAexAmount(reservedBalance) }} AEX
      </div>
      <div class="app-referral-meta">
        <div class="app-referral-meta__referrals">
          {{ t('referral.directReferrals', { count: aexStore.totalReferrals }) }}
        </div>
        <AppButton
          color="warning"
          size="sm"
          icon="sell"
          :disable="availableBalance <= 0"
          @click="showSellDialog = true"
        >
          {{ t('referral.sell') }}
        </AppButton>
      </div>

      <!-- Referral code card -->
      <AppSurface padded class="app-referral-code-card">
        <div class="app-referral-code-card__title">{{ t('referral.yourCode') }}</div>
        <div class="app-referral-code-card__code-row">
          <div class="app-referral-code-card__code">{{ referralCode }}</div>
          <q-btn
            round
            flat
            dense
            icon="content_copy"
            color="warning"
            size="sm"
            :aria-label="t('referral.copyCode')"
            @click="copyCode"
          />
        </div>

        <div class="q-mt-md">
          <div class="app-referral-code-card__link-label text-caption text-grey-7 q-mb-xs">
            {{ t('referral.referralLinkLabel') }}
          </div>
          <q-input
            :model-value="referralLink"
            readonly
            dense
            outlined
            color="warning"
            class="app-referral-code-card__link-input"
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
        </div>

        <div class="q-mt-md">
          <AppButton block color="warning" icon="share" @click="shareLink">
            {{ t('referral.share') }}
          </AppButton>
        </div>
      </AppSurface>

      <!-- How it works instruction -->
      <AppSurface padded class="app-referral-instruction">
        <div class="text-weight-bold text-subtitle2 q-mb-sm">{{ t('referral.howItWorks') }}</div>
        <div class="app-referral-instruction__steps">
          <div class="app-referral-instruction__step">
            <q-icon name="share" color="warning" size="20px" class="q-mr-sm" />
            <span>{{ t('referral.instructionStep1') }}</span>
          </div>
          <div class="app-referral-instruction__step">
            <q-icon name="person_add" color="warning" size="20px" class="q-mr-sm" />
            <span>{{ t('referral.instructionStep2') }}</span>
          </div>
          <div class="app-referral-instruction__step">
            <q-icon name="emoji_events" color="warning" size="20px" class="q-mr-sm" />
            <span>{{ t('referral.instructionStep3') }}</span>
          </div>
        </div>
        <div class="text-caption text-grey-6 q-mt-sm">{{ t('referral.instructionReward') }}</div>
      </AppSurface>

      <!-- Referrals list -->
      <div>
        <div class="app-section-label q-mb-sm">
          {{ t('referral.invited', { count: aexStore.totalReferrals }) }}
        </div>

        <AppSurface v-if="aexStore.referralLoading" class="q-pa-md">
          <div class="row justify-center">
            <q-spinner-dots color="warning" size="32px" />
          </div>
        </AppSurface>

        <template v-else-if="referrals.length">
          <AppSurface class="app-referral-list">
            <div
              v-for="ref in referrals"
              :key="ref.id"
              class="app-referral-item"
            >
              <div class="app-referral-item__info">
                <div class="app-referral-item__name">{{ ref.displayName }}</div>
                <div class="app-referral-item__date">{{ formatDate(ref.joinedAt) }}</div>
              </div>
              <div class="app-referral-item__earned">
                +{{ formatAexAmount(ref.earnedAex) }} AEX
              </div>
            </div>
          </AppSurface>
        </template>

        <AppSurface v-else-if="aexStore.referralLoaded" class="q-pa-md">
          <div class="app-empty-state">{{ t('referral.noReferrals') }}</div>
        </AppSurface>
      </div>

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
          <q-infinite-scroll
            ref="infiniteScrollRef"
            :scroll-target="txScrollRef"
            :offset="120"
            :disable="!aexStore.txHasMore || aexStore.txLoading || aexStore.txRefreshing"
            @load="loadMore"
          >
            <template v-if="transactions.length">
              <AppSurface class="app-referral-tx-list">
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
            </template>

            <AppSurface
              v-else-if="!aexStore.txLoading && aexStore.txLoaded"
              class="q-pa-md"
            >
              <div class="app-empty-state">{{ t('referral.noTransactions') }}</div>
            </AppSurface>

            <template #loading>
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="warning" size="32px" />
              </div>
            </template>
          </q-infinite-scroll>
        </div>
      </div>
    </div>

    <!-- Sell dialog -->
    <AexSellDialog v-model="showSellDialog" @sold="onSold" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Notify } from 'quasar';

import AexBalanceCard from '@components/ui/AexBalanceCard.vue';
import AppButton from '@components/ui/AppButton.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import AexSellDialog from '@components/aex/AexSellDialog.vue';
import { useAexStore } from '@stores/aex.store';
import { useProfileStore } from '@stores/profile.store';
import { formatMiniappTime } from '@utils/formatters';

const { locale, t } = useI18n();
const aexStore = useAexStore();
const profileStore = useProfileStore();

const infiniteScrollRef = ref<{ resume: () => void; stop: () => void } | null>(null);
const txScrollRef = ref<HTMLElement | null>(null);
const showSellDialog = ref(false);

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string;

const referralCode = computed(() => aexStore.referralInfo?.referralCode ?? '...');
const referrals = computed(() => aexStore.referralInfo?.referrals ?? []);

const availableBalance = computed(() => aexStore.balance?.available ?? 0);

const reservedBalance = computed(() => {
  const b = aexStore.balance;
  if (!b) return 0;
  return Math.max(0, b.totalEarned - b.totalWithdrawn - b.available);
});

const referralLink = computed(() => {
  if (!BOT_USERNAME || !referralCode.value || referralCode.value === '...') {
    return '';
  }
  return `https://t.me/${BOT_USERNAME}?startapp=ref_${referralCode.value}`;
});

onMounted(async () => {
  const tasks: Promise<void>[] = [];

  if (!aexStore.referralLoaded) {
    tasks.push(aexStore.loadReferral());
  }

  if (!aexStore.txLoaded) {
    tasks.push(aexStore.loadFirstPage());
  }

  if (!profileStore.loaded || !profileStore.data) {
    tasks.push(profileStore.load());
  }

  await Promise.all(tasks);

  // Sync balance from profile if available
  if (profileStore.data?.aex?.balance) {
    aexStore.setBalance(profileStore.data.aex.balance);
  }
});

async function loadMore(_: number, done: (stop?: boolean) => void) {
  await aexStore.loadNextPage();
  done(!aexStore.txHasMore);
}

async function refreshTx() {
  await aexStore.refreshTransactions();
  infiniteScrollRef.value?.resume();
}

function onSold() {
  // Refresh transactions after a successful sell
  void aexStore.refreshTransactions();
}

function copyCode() {
  void navigator.clipboard.writeText(referralCode.value);
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
  return formatMiniappTime(value, locale.value);
}

function formatAexAmount(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString(locale.value);
  }
  return value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
