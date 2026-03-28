const { configure } = require('quasar/wrappers');
const { resolve } = require('node:path');

module.exports = configure(() => ({
  boot: ['axios', 'telegram', 'i18n', 'init'],
  css: ['app.scss'],
  extras: ['roboto-font', 'fontawesome-v6', 'mdi-v7', 'material-icons'],
  build: {
    target: {
      browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
      node: 'node20',
    },
    vueRouterMode: 'hash',
    typescript: {
      strict: true,
      vueShim: true,
    },
    extendViteConf(viteConf) {
      viteConf.resolve ??= {};
      viteConf.resolve.alias ??= {};
      Object.assign(viteConf.resolve.alias, {
        '@': resolve(__dirname, 'src'),
        '@boot': resolve(__dirname, 'src/boot'),
        '@components': resolve(__dirname, 'src/components'),
        '@stores': resolve(__dirname, 'src/stores'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@layouts': resolve(__dirname, 'src/layouts'),
        '@services': resolve(__dirname, 'src/services'),
        '@types': resolve(__dirname, 'src/types'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@i18n': resolve(__dirname, 'src/i18n'),
      });
    },
  },
  devServer: {
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
