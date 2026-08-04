// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // 1. Global Ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  // 2. JavaScript Baseline & Security (Applies to all files)
  js.configs.recommended,
  security.configs.recommended,

  // 3. Import hygiene (ordering + cycle detection) — all files
  importX.flatConfigs.recommended,
  {
    rules: {
      // Noisy false positives with plugin default-imports that also re-export names
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },

  // 4. TypeScript Rules & Type-Checking (Applies ONLY to .ts files)
  {
    files: ['**/*.ts'],
    extends: [
      // Stricter, type-aware correctness ruleset (superset of recommendedTypeChecked)
      ...tseslint.configs.strictTypeChecked,
      // Type-aware stylistic rules (Prettier-safe; conflicts disabled in step 5)
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      // Modern import-x resolver API (replaces legacy `import-x/resolver`);
      // resolves TS paths, package "exports", and @types.
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: import.meta.dirname + '/tsconfig.json',
        }),
      ],
    },
    rules: {
      // NestJS conventions
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',

      // Async & Promise safety
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // NestJS uses decorated "empty" classes (@Module, @Injectable) — allow them
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true },
      ],

      // Security: object-injection is very noisy (high false-positive), keep off;
      // treat the fs one as a hard error so it can't silently accumulate.
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'error',

      // Import ordering + no circular deps (valuable in large Nest codebases)
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-cycle': 'error',
    },
  },

  // 5. Prettier formatting override (MUST BE LAST)
  eslintConfigPrettier,
);
