import { defineConfig } from '#q-app/wrappers';

export default defineConfig((/* ctx */) => {
  return {
    boot: ['axios', 'telegram', 'init'],
    css: ['app.scss'],
    extras: ['roboto-font', 'material-icons'],
    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },
      vueRouterMode: 'hash',
      typescript: { strict: true },
    },
    devServer: {
      port: 5173,
    },
    framework: {
      config: {},
      plugins: ['Notify', 'Loading', 'Dialog'],
    },
  };
});
