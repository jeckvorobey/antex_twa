<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--referral">
      <AexBalanceCard
        class="app-referral-balance-card"
        :balance="availableBalance"
        :label="t('referral.balanceLabel')"
      />

      <div v-if="reservedBalance > 0" class="app-referral-reserved">
        {{ t('referral.reserved') }}: {{ formatTokenAmount(reservedBalance) }} ATXG
      </div>

      <AntexCard padded class="app-referral-link-card">
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
            <q-btn
              round
              flat
              dense
              icon="share"
              color="warning"
              size="sm"
              :aria-label="t('referral.share')"
              @click="shareLink"
            />
          </template>
        </q-input>
      </AntexCard>

      <AntexCard padded class="app-referral-info-card justify-between">
        <div class="app-referral-info-card__header row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <q-icon name="group_add" color="warning" size="22px" class="q-mr-sm" />
            <span class="app-referral-info-card__title">{{ t('referral.invited') }}</span>
          </div>

          <div v-if="aexStore.totalReferrals > 0" class="app-referral-info-card__header-count">
            {{ aexStore.totalReferrals }}
          </div>
        </div>

        <AntexCard v-if="aexStore.referralLoading" class="q-pa-md q-mt-sm">
          <div class="row justify-center">
            <q-spinner-dots color="warning" size="24px" />
          </div>
        </AntexCard>

        <div
          v-else-if="aexStore.referralLoaded && aexStore.totalReferrals === 0"
          class="app-referral-info-card__empty q-mt-sm"
        >
          {{ t('referral.noReferrals') }}
        </div>
      </AntexCard>

      <AntexCard padded class="app-referral-instruction">
        <div class="text-weight-bold text-subtitle2 q-mb-sm">{{ t('referral.howItWorks') }}</div>
        <div class="row q-col-gutter-sm">
          <div v-for="step in instructionSteps" :key="step.title" class="col-12 col-sm">
            <div class="app-referral-step-card q-pa-sm">
              <div class="row items-center no-wrap">
                <q-icon :name="step.icon" color="warning" size="22px" class="q-mr-sm" />
                <div class="text-weight-medium">{{ step.title }}</div>
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                <template v-if="step.exchangeLink">
                  {{ t('referral.instructionStep5DescriptionPrefix') }}
                  <router-link :to="{ name: 'exchange' }" class="text-warning">
                    {{ t('referral.instructionStep5ExchangeLink') }}
                  </router-link>
                  {{ t('referral.instructionStep5DescriptionSuffix') }}
                </template>
                <template v-else>
                  {{ step.description }}
                </template>
              </div>
            </div>
          </div>
        </div>
      </AntexCard>

      <AntexCard padded class="app-referral-terms">
        <div class="text-weight-bold text-subtitle2 q-mb-sm">{{ t('referral.termsTitle') }}</div>
        <div class="row q-col-gutter-sm">
          <div v-for="term in programTerms" :key="term.label" class="col-6">
            <div class="app-referral-term q-pa-sm">
              <div class="text-caption text-grey-6">{{ term.label }}</div>
              <div class="app-referral-term__value q-mt-xs">{{ term.value }}</div>
            </div>
          </div>
        </div>
      </AntexCard>

      <AntexCard class="app-profile-card">
        <AppInfoRow
          icon="groups"
          :title="t('referral.myReferrals')"
          clickable
          @click="goToReferrals"
        />
        <AppInfoRow
          icon="history"
          :title="t('referral.history')"
          clickable
          @click="goToOperations"
        />
      </AntexCard>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAntexNotify } from '@/composables/useAntexNotify';

import AexBalanceCard from '@components/ui/AexBalanceCard.vue';
import AppInfoRow from '@components/ui/AppInfoRow.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import { useAexStore } from '@stores/aex.store';
import { openSafeExternalUrl } from '@utils/safe-external-url';

const { locale, t } = useI18n();
const { notify } = useAntexNotify();
const router = useRouter();
const aexStore = useAexStore();

const fallbackProgramConfig = {
  referralPercent: '0',
  referralMinWithdraw: '0',
  referralMaxWithdraw: null,
  aexRate: '0',
  aexWithdrawLimit: '0',
};

const availableBalance = computed(() => {
  const b = aexStore.balance;
  if (!b) return 0;
  return b.available;
});

const reservedBalance = computed(() => {
  const b = aexStore.balance;
  if (!b) return 0;
  return b.reserved;
});

const referralLink = computed(() => aexStore.referralInfo?.referralLink ?? '');
const programConfig = computed(() => aexStore.referralInfo?.programConfig ?? fallbackProgramConfig);
const referralPercentValue = computed(() => parseDecimal(programConfig.value.referralPercent));
const programTerms = computed(() => [
  {
    label: t('referral.terms.referralPercent'),
    value: formatPercent(referralPercentValue.value),
  },
  {
    label: t('referral.terms.referralMinWithdraw'),
    value: `${formatTokenAmount(parseDecimal(programConfig.value.aexWithdrawLimit))} ATXG`,
  },
  {
    label: t('referral.terms.referralMaxWithdraw'),
    value:
      programConfig.value.referralMaxWithdraw === null
        ? t('referral.noLimit')
        : `${formatTokenAmount(parseDecimal(programConfig.value.referralMaxWithdraw))} ATXG`,
  },
  {
    label: t('referral.terms.aexRate'),
    value: t('referral.aexRateValue', {
      rate: formatTokenAmount(parseDecimal(programConfig.value.aexRate)),
    }),
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
    exchangeLink: true,
  },
]);

onMounted(async () => {
  const tasks: Promise<void>[] = [];

  if (!aexStore.referralLoaded) {
    tasks.push(aexStore.loadReferral());
  }

  tasks.push(aexStore.loadWallet());

  await Promise.all(tasks);
});

function copyLink() {
  if (referralLink.value) {
    void navigator.clipboard.writeText(referralLink.value);
    notify('positive', t('referral.linkCopied'));
  }
}

function shareLink() {
  if (!referralLink.value) {
    return;
  }

  const tg = window.Telegram?.WebApp;
  if (tg) {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink.value)}&text=${encodeURIComponent(t('referral.shareText'))}`;
    openSafeExternalUrl(shareUrl);
  } else {
    void navigator.clipboard.writeText(referralLink.value);
  }
}

function goToReferrals() {
  void router.push({ name: 'referralReferrals' });
}

function goToOperations() {
  void router.push({ name: 'referralOperations' });
}

function formatTokenAmount(value: number): string {
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
  return `${formatTokenAmount(value)}%`;
}
</script>
