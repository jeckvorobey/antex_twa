<template>
  <Transition name="app-page-loader">
    <div
      v-if="showing"
      class="app-page-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="app-page-loader__glow app-page-loader__glow--top" />
      <div class="app-page-loader__glow app-page-loader__glow--bottom" />
      <div class="app-page-loader__particle app-page-loader__particle--one" />
      <div class="app-page-loader__particle app-page-loader__particle--two" />
      <div class="app-page-loader__particle app-page-loader__particle--three" />
      <div class="app-page-loader__particle app-page-loader__particle--four" />

      <div class="app-page-loader__content">
        <div class="app-page-loader__orbit" aria-hidden="true">
          <div class="app-page-loader__ring app-page-loader__ring--outer" />
          <div class="app-page-loader__ring app-page-loader__ring--inner" />
          <div class="app-page-loader__arc" />
          <div class="app-page-loader__coin app-page-loader__coin--primary" />
          <div class="app-page-loader__coin app-page-loader__coin--secondary" />

          <div class="app-page-loader__logo-shell">
            <img class="app-page-loader__logo" :src="logoUrl" alt="" />
          </div>
        </div>

        <div class="app-page-loader__title">Загружаем AntEx</div>
        <div class="app-page-loader__subtitle">Готовим актуальные курсы и ваши данные</div>
      </div>

      <div class="app-page-loader__progress">
        <div class="app-page-loader__progress-label">Синхронизация данных</div>
        <div class="app-page-loader__progress-track">
          <div class="app-page-loader__progress-fill" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import logoUrl from '../../assets/images/logo.PNG';

defineProps<{
  showing: boolean;
}>();
</script>
