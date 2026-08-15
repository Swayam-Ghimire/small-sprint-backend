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
    // `generated/**` is Prisma/Zod output — machine-written, never hand-edited,
    // and it legitimately contains `any`. Linting it would fail the zero-`any`
    // policy for code you do not own.
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'generated/**'],
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

      // ─────────────────────────────────────────────────────────────
      // ZERO-`any` POLICY — see docs/eslint-prettier-rules.md §3
      // `any` switches the type-checker OFF for whatever it touches.
      // Writing it is an error, and so is *using* a value that is
      // already `any` (e.g. JSON.parse, untyped libs, req.body).
      // Escape hatch: use `unknown` + a Zod parse, never `any`.
      // ─────────────────────────────────────────────────────────────

      // 1. You may not WRITE `any` anywhere — including `...args: any[]`.
      '@typescript-eslint/no-explicit-any': [
        'error',
        { ignoreRestArgs: false },
      ],

      // 2. You may not USE a value that is already `any` (contagion guards).
      '@typescript-eslint/no-unsafe-assignment': 'error', // const x = anyVal
      '@typescript-eslint/no-unsafe-member-access': 'error', // anyVal.foo
      '@typescript-eslint/no-unsafe-call': 'error', // anyVal()
      '@typescript-eslint/no-unsafe-return': 'error', // return anyVal
      '@typescript-eslint/no-unsafe-argument': 'error', // fn(anyVal)
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error', // `Function`
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error', // `Object`, `String`

      // 3. `any` absorbs unions silently: `string | any` collapses to `any`.
      '@typescript-eslint/no-redundant-type-constituents': 'error',

      // 4. Close the back doors that would let `any` back in.
      //    `@ts-ignore` is banned outright; `@ts-expect-error` needs a reason.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],

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
