// ================================
// CONFIGURACIÓN DE ESLINT PARA REACT + VITE
// Archivo: eslint.config.js
// ================================
// ESLint se encarga de analizar tu código y avisar errores
// o malas prácticas antes de que lleguen a producción.

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import security from 'eslint-plugin-security'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

// defineConfig permite estructurar la configuración moderna de ESLint
export default defineConfig([

  // ---------------------------------
  // Carpetas que ESLint ignorará
  // ---------------------------------
  // No analizará la carpeta dist porque contiene archivos compilados
  globalIgnores(['dist', 'coverage']),

  // ---------------------------------
  // Archivos que corren en Node (no en el browser):
  // configs de build/test y los propios archivos de test (usan `global`).
  // ---------------------------------
  {
    files: ['vite.config.js', 'playwright.config.js', 'src/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    // Archivos a los que se aplicará esta configuración
    files: ['**/*.{js,jsx}'],
    plugins: { security, react },

    // ---------------------------------
    // Configuraciones base recomendadas
    // ---------------------------------
    extends: [
      js.configs.recommended,                     // Reglas básicas de JavaScript
      reactHooks.configs['recommended-latest'],   // Buenas prácticas para React Hooks
      reactRefresh.configs.vite,                  // Soporte para React Fast Refresh con Vite
      security.configs.recommended,
    ],

    // ---------------------------------
    // Opciones del lenguaje
    // ---------------------------------
    languageOptions: {
      ecmaVersion: 2020,           // Versión de JavaScript permitida
      globals: globals.browser,    // Variables globales del navegador (window, document, etc.)

      parserOptions: {
        ecmaVersion: 'latest',     // Permite sintaxis moderna
        ecmaFeatures: { jsx: true }, // Habilita JSX para React
        sourceType: 'module',      // Usa ES Modules (import/export)
      },
    },

    // ---------------------------------
    // Reglas personalizadas
    // ---------------------------------
    rules: {
      // Evita errores por variables no usadas,
      // PERO ignora las que comiencen con mayúscula o guión bajo.
      // Útil para constantes globales o props que se usan indirectamente.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
])