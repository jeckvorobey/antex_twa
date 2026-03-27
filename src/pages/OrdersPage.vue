<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">📋 Мои заявки</div>
    <q-list bordered separator>
      <q-item v-for="order in orders" :key="order.id">
        <q-item-section>
          <q-item-label>Заявка #{{ order.id }}</q-item-label>
          <q-item-label caption>
            {{ order.amountSell.toLocaleString() }} {{ order.currencySell }} →
            {{ order.amountBuy.toLocaleString() }} {{ order.currencyBuy }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge :color="statusColor(order.status)">{{ statusLabel(order.status) }}</q-badge>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Order } from 'src/types/exchange.interface';

const orders = ref<Order[]>([]);

function statusColor(status: number): string {
  const colors: Record<number, string> = { 1: 'blue', 2: 'orange', 3: 'purple', 4: 'green', 5: 'red' };
  return colors[status] ?? 'grey';
}

function statusLabel(status: number): string {
  const labels: Record<number, string> = {
    1: 'Новая', 2: 'Подтверждена', 3: 'В обработке', 4: 'Завершена', 5: 'Отменена',
  };
  return labels[status] ?? 'Неизвестно';
}
</script>
