import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@boot': fileURLToPath(new URL('./src/boot', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@i18n': fileURLToPath(new URL('./src/i18n', import.meta.url)),
      '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      // Vitest выбирает server-сборку Quasar по condition "node", тогда как
      // компоненты Mini App выполняются в DOM окружении happy-dom.
      quasar: fileURLToPath(
        new URL('./node_modules/quasar/dist/quasar.client.js', import.meta.url),
      ),
      '#q-app/wrappers': fileURLToPath(new URL('./tests/mocks/q-app-wrappers.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
