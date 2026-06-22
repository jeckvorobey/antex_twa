import js from '@eslint/js';

export default [
  {
    ignores: ['.quasar/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
];
