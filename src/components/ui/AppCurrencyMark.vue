<template>
  <span
    v-if="props.mark === 'USDT'"
    class="app-currency-mark app-currency-mark__usdt"
    aria-label="USDT"
    role="img"
  >
    <svg viewBox="0 0 2000 2000" aria-hidden="true">
      <defs>
        <linearGradient
          id="app-currency-mark-usdt-gradient"
          x1="280"
          y1="1680"
          x2="1580"
          y2="360"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#1d8d72" />
          <stop offset="1" stop-color="#77dbc7" />
        </linearGradient>
      </defs>
      <circle cx="1000" cy="1000" r="1000" fill="url(#app-currency-mark-usdt-gradient)" />
      <path
        d="M1122.5,869.6v-141h322V513H555.4v215.6h322v141c-261.5,12-458.1,63.6-458.1,125.5
        c0,61.9,196.6,113.5,458.1,125.5v452h245.1v-452c261-12,457.1-63.6,457.1-125.5
        C1579.5,933.2,1383.5,881.6,1122.5,869.6z M1122.5,1082.7c-6.6,0.4-40.3,2.5-115.4,2.5
        c-59.8,0-101.9-1.8-116.8-2.5c-230.4-10.2-402.3-50.1-402.3-97.9c0-47.8,171.9-87.7,402.3-97.9
        v156.1c15.1,1.1,58.3,3.7,117.8,3.7c71.4,0,107.3-3,114.4-3.7V886.9c229.9,10.2,401.4,50.1,401.4,97.8
        C1523.9,1032.6,1352.4,1072.5,1122.5,1082.7z"
        fill="#fff"
      />
    </svg>
  </span>
  <span v-else class="app-currency-mark">
    {{ mark }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  mark: string;
}>();
</script>

<style scoped>
.app-currency-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.app-currency-mark__usdt {
  width: 18px;
  height: 18px;
}

.app-currency-mark__usdt svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
