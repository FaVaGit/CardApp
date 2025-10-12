import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  js.configs.recommended,
  // Global ignore patterns (ESLint v9 flat config)
  {
    ignores: [
      'archive/**',
      'backup/**',
      'public/test-backend.js',
      'api-endpoint-test.js',
      'test_signalr.js',
      'scripts/coverage-summary.mjs',
      'dist/**',
      'coverage/**',
      'lcov-report/**',
      'Backend/ComplicityGame.Tests/TestResults/**'
    ]
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  TextEncoder: 'readonly',
  crypto: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  fetch: 'readonly',
  URLSearchParams: 'readonly',
  navigator: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  clearInterval: 'readonly',
  setInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  process: 'readonly',
  module: 'readonly',
  require: 'readonly',
  global: 'readonly'
      }
  ,parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
  settings: { react: { version: 'detect' } },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'react/react-in-jsx-scope': 'off',
  'react/jsx-uses-react': 'off',
  'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  // Node scripts override (allow process/console unflagged)
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    }
  }
];
