import eslintConfigExpo from 'eslint-config-expo/flat.js';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/android/**',
      '**/ios/**',
      '**/.expo/**',
      '**/.agents/**',
      '**/excercise/**',
      '**/assets/**',
      '**/supabase/**',
      '**/.bundle/**',
      '**/dist/**',
      '**/web/**',
      '**/jest.setup.js',
      '**/scratch/**',
      '**/scripts/**',
      '**/*.js',
      '**/*.mjs',
      '**/*.json',
      '**/*.d.ts',
    ],
  },
  ...eslintConfigExpo,
  {
    rules: {
      'import/order': 'warn',
    },
  },
];
