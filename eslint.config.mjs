import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // 👈 ESTE es el que evita los errores que te aparecen
      'react-hooks/exhaustive-deps': 'off',
      'no-console': 'off',
      'react/jsx-key': 'off',
    },
  },
];

export default eslintConfig;
