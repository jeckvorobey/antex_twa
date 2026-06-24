import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  fetchAexReferralInfo,
  fetchAexTransactions,
  transferAex,
} from '@services/api/miniapp.service';
import type {
  AexBalance,
  AexReferralInfo,
  AexTransactionItem,
} from '@types/miniapp';

const TX_PAGE_LIMIT = 20;

export const useAexStore = defineStore('aex', () => {
  // ── Referral ──────────────────────────────────────────────────────
  const referralInfo = ref<AexReferralInfo | null>(null);
  const referralLoading = ref(false);
  const referralLoaded = ref(false);

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

  // ── Balance setter (called from profile store) ────────────────────

  function setBalance(aexBalance: AexBalance) {
    balance.value = aexBalance;
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

      // Optimistically reduce available balance
      if (balance.value) {
        balance.value = {
          ...balance.value,
          available: Math.max(0, balance.value.available - amount),
        };
      }

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

  return {
    // referral
    referralInfo,
    referralLoading,
    referralLoaded,
    totalReferrals,
    loadReferral,
    // balance
    balance,
    setBalance,
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
