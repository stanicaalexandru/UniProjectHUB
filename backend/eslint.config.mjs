// ESLint pentru backend (NestJS + TypeScript), cu regulile recomandate typescript-eslint
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'uploads/', 'src/database/migrations/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { parserOptions: { project: false } },
    rules: {
      // Parametrii nefolositi din semnaturile NestJS (ex. req, file) sunt permisi daca incep cu _
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['test/**/*.mjs'],
    languageOptions: { globals: { fetch: 'readonly', process: 'readonly', console: 'readonly', URL: 'readonly', FormData: 'readonly', Blob: 'readonly' } },
  },
);
