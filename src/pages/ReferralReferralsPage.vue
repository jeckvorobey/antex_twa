<template>
  <q-page class="app-page app-page--history column no-wrap">
    <div class="app-screen app-screen--history column no-wrap full-height q-pt-md">
      <AexBalanceCard
        :balance="totalAccrued"
        :label="t('referral.totalAccrued')"
        class="app-referral-balance-card"
      />

      <div class="row items-center q-my-sm">
        <div class="app-section-label col">{{ t('referral.myReferrals') }}</div>
        <q-btn
          round
          flat
          dense
          icon="refresh"
          color="warning"
          size="sm"
          :aria-label="t('referral.refresh')"
          :loading="aexStore.referralsRefreshing"
          @click="refresh"
        >
          <q-tooltip>{{ t('referral.refresh') }}</q-tooltip>
        </q-btn>
      </div>

      <div ref="scrollRef" class="col app-referral-tx-scroll">
        <AppSurface v-if="aexStore.referrals.length" class="app-referral-tx-list">
          <div
            v-for="referral in aexStore.referrals"
            :key="referral.id"
            class="app-referral-tx-item"
          >
            <div class="row items-center no-wrap col">
              <q-avatar size="36px" class="q-mr-sm">
                <q-img
                  v-if="referral.photoUrl"
                  :src="referral.photoUrl"
                  fit="cover"
                  width="100%"
                  height="100%"
                  :alt="referral.displayName"
                  no-spinner
                />
                <q-icon v-else name="person_outline" size="20px" />
              </q-avatar>

              <div class="app-referral-tx-item__info">
                <div class="app-referral-tx-item__desc">{{ referral.displayName }}</div>
                <div v-if="referral.username" class="app-referral-tx-item__detail">
                  @{{ referral.username }}
                </div>
                <div class="app-referral-tx-item__date">
                  {{ t('referral.joinedAt') }}: {{ formatDate(referral.joinedAt) }}
                </div>
              </div>
            </div>

            <div class="app-referral-tx-item__amount text-warning">
              {{ referral.rewardPercent }}%
            </div>
          </div>
        </AppSurface>

        <AppSurface
          v-else-if="!aexStore.referralsLoading && aexStore.referralsLoaded"
          class="app-referral-tx-empty q-pa-md"
        >
          <div class="app-empty-state">{{ t('referral.myReferralsEmpty') }}</div>
        </AppSurface>

        <q-infinite-scroll
          v-if="aexStore.referralsHasMore"
          ref="infiniteScrollRef"
          :scroll-target="scrollRef"
          :offset="120"
          :disable="aexStore.referralsLoading || aexStore.referralsRefreshing"
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
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import AexBalanceCard from '@components/ui/AexBalanceCard.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useAexStore } from '@stores/aex.store';
import { formatMiniappDateTime } from '@utils/formatters';

const { locale, t } = useI18n();
const aexStore = useAexStore();
const infiniteScrollRef = ref<{ resume: () => void; stop: () => void } | null>(null);
const scrollRef = ref<HTMLElement | null>(null);

const totalAccrued = computed(() => parseDecimal(aexStore.referralsSummary?.totalAccrued));

onMounted(async () => {
  if (!aexStore.referralsLoaded || !aexStore.referrals.length) {
    await aexStore.loadReferralsFirstPage();
  } else {
    void aexStore.refreshReferrals();
  }
});

async function refresh() {
  await aexStore.refreshReferrals();
  infiniteScrollRef.value?.resume();
}

async function loadMore(_: number, done: (stop?: boolean) => void) {
  await aexStore.loadReferralsNextPage();
  done(!aexStore.referralsHasMore);
}

function formatDate(value: string) {
  return formatMiniappDateTime(value, locale.value);
}

function parseDecimal(value: string | null | undefined): number {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}
</script>
