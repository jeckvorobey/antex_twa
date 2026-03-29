import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from '#q-app/wrappers';

const rootDir = process.cwd();
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8')) as {
  version: string;
};

export default defineConfig((ctx) => ({
  boot: ['telegram', 'i18n', 'axios', 'init'],
  css: ['app.scss'],
  extras: ['roboto-font', 'fontawesome-v6', 'mdi-v7', 'material-icons'],
  build: {
    target: {
      browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      node: 'node20',
    },
    alias: {
      '@': resolve(rootDir, 'src'),
      '@boot': resolve(rootDir, 'src/boot'),
      '@components': resolve(rootDir, 'src/components'),
      '@stores': resolve(rootDir, 'src/stores'),
      '@pages': resolve(rootDir, 'src/pages'),
      '@layouts': resolve(rootDir, 'src/layouts'),
      '@services': resolve(rootDir, 'src/services'),
      '@types': resolve(rootDir, 'src/types'),
      '@utils': resolve(rootDir, 'src/utils'),
      '@i18n': resolve(rootDir, 'src/i18n'),
    },
    vueRouterMode: 'hash',
    sourcemap: ctx.dev,
    env: {
      APP_VERSION: pkg.version,
    },
    typescript: {
      strict: true,
      vueShim: true,
    },
    extendViteConf(viteConf) {
      viteConf.optimizeDeps ??= {};
      viteConf.optimizeDeps.entries = ['index.html', 'src/**/*.{js,ts,vue}'];
    },
  },
  devServer: {
    host: '0.0.0.0',
    open: false,
    port: 5173,
  },
  framework: {
    iconSet: 'material-icons',
    config: {
      dark: true,
      brand: {
        primary: '#D4AF37',
        secondary: '#123530',
        accent: '#F2D27A',
        dark: '#0F2A26',
        positive: '#4CAF50',
        negative: '#E53935',
        info: '#29B6F6',
        warning: '#FFB300',
      },
    },
    plugins: ['Dark', 'Notify', 'Loading', 'Dialog', 'BottomSheet'],
  },
  animations: [],
}));
