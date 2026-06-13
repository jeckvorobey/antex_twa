import { describe, expect, it } from 'vitest';

describe('quasar.config', () => {
  it('uses modern quasar v2 defaults for miniapp build and dev server', async () => {
    const { default: createQuasarConfig } = await import('../../quasar.config.ts');
    const quasarConfig = createQuasarConfig({
      dev: true,
      prod: false,
      mode: { spa: true },
      modeName: 'spa',
    });

    const viteConf: Record<string, unknown> = {};
    quasarConfig.build.extendViteConf(viteConf);

    expect(quasarConfig.boot).toEqual(['telegram', 'i18n', 'axios', 'init']);
    expect(quasarConfig.build.target).toEqual({
      browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      node: 'node20',
    });
    expect(quasarConfig.build.env).toEqual({
      APP_VERSION: '1.0.0',
    });
    expect(quasarConfig.devServer).toMatchObject({
      host: '0.0.0.0',
      open: false,
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    });
    expect(quasarConfig.build.alias).toMatchObject({
      '@': expect.stringContaining('/src'),
      '@boot': expect.stringContaining('/src/boot'),
      '@i18n': expect.stringContaining('/src/i18n'),
    });
    expect(viteConf).toMatchObject({
      optimizeDeps: {
        entries: ['index.html', 'src/**/*.{js,ts,vue}'],
      },
    });
  });
});
