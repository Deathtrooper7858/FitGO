import eslintConfigExpo from 'eslint-config-expo/flat.js';

export default [
  { ignores: ['node_modules/**', 'supabase/**', '.bundle/**', 'dist/**', 'web/**', 'jest.setup.js', 'scratch/**', 'scripts/**'] },
  ...eslintConfigExpo,
  {
    rules: {
      'import/order': 'warn',
    },
  },
];
