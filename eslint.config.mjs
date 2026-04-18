import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // Upgrade unused-vars to error; allow _-prefixed intentional ignores
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],

      // Enforce `import type` for type-only imports (auto-fixable)
      // disallowTypeAnnotations:false allows inline `import()` in type positions (common in component props)
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],

      // Prefer T[] over Array<T> (auto-fixable)
      '@typescript-eslint/array-type': ['error', { default: 'array' }],

      // Warn on non-null assertions (!) — project policy discourages them
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Self-close JSX elements with no children (auto-fixable)
      'react/self-closing-comp': ['error', { component: true, html: true }],

      // No unnecessary fragment wrappers (auto-fixable; allow expression contexts)
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],

      // Warn when array index is used as key — fragile reconciliation
      'react/no-array-index-key': 'warn',

      // No console.log in production code; warn/error are acceptable
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Enforce === everywhere (use null comparison exemption for convenience)
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // Prefer { a } over { a: a } (auto-fixable)
      'object-shorthand': ['error', 'always'],

      // Prefer template literals over string concatenation (auto-fixable)
      'prefer-template': 'error',
    },
  },
]);

export default eslintConfig;
