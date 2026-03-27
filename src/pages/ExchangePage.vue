<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">💱 Обмен валют</div>

    <q-card v-if="store.rates" class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1">Курс RUB → THB</div>
        <div class="text-h5 text-primary">{{ store.rates.rubthb.toFixed(4) }}</div>
      </q-card-section>
    </q-card>

    <q-inner-loading :showing="store.loading" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useExchangeStore } from 'src/stores/exchange.store';

const store = useExchangeStore();
onMounted(() => store.fetchRates());
</script>
