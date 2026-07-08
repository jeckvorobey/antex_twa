import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  fetchAexReferralInfo,
  fetchAexReferrals,
  fetchAexTransactions,
  fetchAexWallet,
  transferAex,
} from '@services/api/miniapp.service';
import type {
  AexBalance,
  AexReferralInfo,
  AexReferralsResponse,
  AexReferralUserItem,
  AexTransactionItem,
} from '@types/miniapp';

const TX_PAGE_LIMIT = 20;
const REFERRALS_PAGE_LIMIT = 20;

export const useAexStore = defineStore('aex', () => {
  // ── Referral ──────────────────────────────────────────────────────
  const referralInfo = ref<AexReferralInfo | null>(null);
  const referralLoading = ref(false);
  const referralLoaded = ref(false);

  // ── Referral users ────────────────────────────────────────────────
  const referrals = ref<AexReferralUserItem[]>([]);
  const referralsSummary = ref<Pick<AexReferralsResponse, 'totalAccrued' | 'rewardPercent'> | null>(
    null,
  );
  const referralsLoading = ref(false);
  const referralsLoaded = ref(false);
  const referralsLoadingMore = ref(false);
  const referralsRefreshing = ref(false);
  const referralsHasMore = ref(true);
  const referralsOffset = ref(0);
  const referralsTotal = ref(0);

  // ── Balance ───────────────────────────────────────────────────────
  const balance = ref<AexBalance | null>(null);

  // ── Transactions ──────────────────────────────────────────────────
  const transactions = ref<AexTransactionItem[]>([]);
  const txLoading = ref(false);
  const txLoaded = ref(false);
  const txLoadingMore = ref(false);
  const txRefreshing = ref(false);
  const txHasMore = ref(true);
  const txOffset = ref(0);
  const txTotal = ref(0);

  const totalReferrals = computed(() => referralInfo.value?.totalReferrals ?? 0);
  const aexRate = computed(() => parsePositiveDecimal(referralInfo.value?.programConfig.aexRate));
  const aexWithdrawLimit = computed(() =>
    parsePositiveDecimal(referralInfo.value?.programConfig.aexWithdrawLimit),
  );
  const isAexCurrencyAvailable = ref(false);

  // ── Referral actions ──────────────────────────────────────────────

  async function loadReferral() {
    if (referralLoading.value) {
      return;
    }

    referralLoading.value = true;
    try {
      referralInfo.value = await fetchAexReferralInfo();
    } finally {
      referralLoaded.value = true;
      referralLoading.value = false;
    }
  }

  async function loadReferralsFirstPage() {
    if (referralsLoading.value) {
      return;
    }

    referralsLoading.value = true;
    try {
      const response = await fetchAexReferrals({ limit: REFERRALS_PAGE_LIMIT, offset: 0 });
      applyReferralsResponse(response, true);
    } finally {
      referralsLoaded.value = true;
      referralsLoading.value = false;
    }
  }

  async function loadReferralsNextPage() {
    if (referralsLoading.value || referralsLoadingMore.value || !referralsHasMore.value) {
      return;
    }

    referralsLoadingMore.value = true;
    try {
      const response = await fetchAexReferrals({
        limit: REFERRALS_PAGE_LIMIT,
        offset: referralsOffset.value,
      });
      applyReferralsResponse(response, false);
    } finally {
      referralsLoadingMore.value = false;
    }
  }

  async function refreshReferrals() {
    if (referralsLoading.value || referralsRefreshing.value) {
      return;
    }

    referralsRefreshing.value = true;
    try {
      const response = await fetchAexReferrals({ limit: REFERRALS_PAGE_LIMIT, offset: 0 });
      applyReferralsResponse(response, true);
    } finally {
      referralsRefreshing.value = false;
    }
  }

  function applyReferralsResponse(response: AexReferralsResponse, replace: boolean) {
    const existingIds = new Set(referrals.value.map((existing) => existing.id));
    const nextItems = replace
      ? response.items
      : response.items.filter((item) => !existingIds.has(item.id));
    referrals.value = replace ? nextItems : [...referrals.value, ...nextItems];
    referralsOffset.value = replace ? response.items.length : referralsOffset.value + response.items.length;
    referralsTotal.value = response.total;
    referralsHasMore.value = response.hasMore;
    referralsSummary.value = {
      totalAccrued: response.totalAccrued,
      rewardPercent: response.rewardPercent,
    };
  }

  // ── Balance setter (called from profile store) ────────────────────

  function setBalance(aexBalance: AexBalance) {
    balance.value = aexBalance;
  }

  // ── Wallet balance loader ────────────────────────────────────────

  const walletLoading = ref(false);

  async function loadWallet() {
    if (walletLoading.value) {
      return;
    }

    walletLoading.value = true;
    try {
      const wallet = await fetchAexWallet();
      balance.value = {
        available: parseFloat(wallet.balance_available),
        reserved: parseFloat(wallet.balance_reserved),
        totalEarned: parseFloat(wallet.balance_total),
        totalWithdrawn: 0,
      };
      isAexCurrencyAvailable.value = wallet.is_exchange_available;
    } finally {
      walletLoading.value = false;
    }
  }

  // ── Sell / Transfer ──────────────────────────────────────────────

  const sellLoading = ref(false);

  async function sellAex(
    orderId: number,
    amount: number,
  ): Promise<{ success: boolean }> {
    if (sellLoading.value) {
      return { success: false };
    }

    sellLoading.value = true;
    try {
      await transferAex({ orderId, amount });
      await loadWallet();

      return { success: true };
    } catch {
      return { success: false };
    } finally {
      sellLoading.value = false;
    }
  }

  // ── Transaction actions ───────────────────────────────────────────

  async function loadFirstPage() {
    if (txLoading.value) {
      return;
    }

    txLoading.value = true;
    try {
      const response = await fetchAexTransactions({ limit: TX_PAGE_LIMIT, offset: 0 });
      transactions.value = response.items;
      txOffset.value = response.items.length;
      txTotal.value = response.total;
      txHasMore.value = response.hasMore;
    } finally {
      txLoaded.value = true;
      txLoading.value = false;
    }
  }

  async function loadNextPage() {
    if (txLoading.value || txLoadingMore.value || !txHasMore.value) {
      return;
    }

    txLoadingMore.value = true;
    try {
      const response = await fetchAexTransactions({
        limit: TX_PAGE_LIMIT,
        offset: txOffset.value,
      });
      const existingIds = new Set(transactions.value.map((item) => item.id));
      const nextItems = response.items.filter((item) => !existingIds.has(item.id));
      transactions.value = [...transactions.value, ...nextItems];
      txOffset.value += response.items.length;
      txTotal.value = response.total;
      txHasMore.value = response.hasMore;
    } finally {
      txLoadingMore.value = false;
    }
  }

  async function refreshTransactions() {
    if (txLoading.value || txRefreshing.value) {
      return;
    }

    txRefreshing.value = true;
    try {
      const response = await fetchAexTransactions({ limit: TX_PAGE_LIMIT, offset: 0 });
      transactions.value = response.items;
      txOffset.value = response.items.length;
      txTotal.value = response.total;
      txHasMore.value = response.hasMore;
    } finally {
      txRefreshing.value = false;
    }
  }

  /** Преобразует decimal-строки backend config в число с безопасным fallback. */
  function parsePositiveDecimal(value: string | null | undefined) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  return {
    // referral
    referralInfo,
    referralLoading,
    referralLoaded,
    referrals,
    referralsSummary,
    referralsLoading,
    referralsLoaded,
    referralsLoadingMore,
    referralsRefreshing,
    referralsHasMore,
    referralsTotal,
    totalReferrals,
    aexRate,
    aexWithdrawLimit,
    isAexCurrencyAvailable,
    loadReferral,
    loadReferralsFirstPage,
    loadReferralsNextPage,
    refreshReferrals,
    // balance
    balance,
    setBalance,
    loadWallet,
    walletLoading,
    // sell
    sellLoading,
    sellAex,
    // transactions
    transactions,
    txLoading,
    txLoaded,
    txLoadingMore,
    txRefreshing,
    txHasMore,
    txTotal,
    loadFirstPage,
    loadNextPage,
    refreshTransactions,
  };
});
