import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'web/dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      eqeqeq: ['error', 'always'],
      'no-console': 'warn',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
      // Параметры с «_» в начале (например, _next в обработчике ошибок Express) можно не использовать
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
