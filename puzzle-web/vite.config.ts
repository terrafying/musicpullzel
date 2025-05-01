/// <reference types="vite/client" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import type { UserConfig } from 'vite'

// Virtual module for WASM bindgen placeholder
const wasmBindgenPlugin = {
  name: 'wasm-bindgen-placeholder',
  resolveId(id: string) {
    if (id === '__wbindgen_placeholder__') {
      return '\0virtual:wasm-bindgen-placeholder'
    }
  },
  load(id: string) {
    if (id === '\0virtual:wasm-bindgen-placeholder') {
      return `
        export const __wbindgen_describe = () => {};
        export const __wbindgen_object_drop_ref = (idx) => {};
        export const __wbindgen_number_new = (n) => n;
        export const __wbindgen_string_new = (ptr, len) => {
          const view = new Uint8Array(wasm.memory.buffer, ptr, len);
          return new TextDecoder().decode(view);
        };
        export const __wbindgen_boolean_new = (b) => b;
        export const __wbindgen_is_undefined = (idx) => idx === undefined;
        export const __wbindgen_is_null = (idx) => idx === null;
        export const __wbindgen_is_object = (idx) => typeof idx === 'object';
        export const __wbindgen_is_string = (idx) => typeof idx === 'string';
        export const __wbindgen_is_number = (idx) => typeof idx === 'number';
        export const __wbindgen_is_boolean = (idx) => typeof idx === 'boolean';
        export const __wbindgen_is_function = (idx) => typeof idx === 'function';
        export const __wbindgen_is_symbol = (idx) => typeof idx === 'symbol';
        export const __wbindgen_is_bigint = (idx) => typeof idx === 'bigint';
        export const __wbindgen_is_undefined_or_null = (idx) => idx === undefined || idx === null;
        export const __wbindgen_is_object_or_null = (idx) => typeof idx === 'object';
        export const __wbindgen_is_string_or_null = (idx) => typeof idx === 'string' || idx === null;
        export const __wbindgen_is_number_or_null = (idx) => typeof idx === 'number' || idx === null;
        export const __wbindgen_is_boolean_or_null = (idx) => typeof idx === 'boolean' || idx === null;
        export const __wbindgen_is_function_or_null = (idx) => typeof idx === 'function' || idx === null;
        export const __wbindgen_is_symbol_or_null = (idx) => typeof idx === 'symbol' || idx === null;
        export const __wbindgen_is_bigint_or_null = (idx) => typeof idx === 'bigint' || idx === null;
        export const __wbindgen_is_undefined_or_null_or_object = (idx) => idx === undefined || idx === null || typeof idx === 'object';
        export const __wbindgen_is_undefined_or_null_or_string = (idx) => idx === undefined || idx === null || typeof idx === 'string';
        export const __wbindgen_is_undefined_or_null_or_number = (idx) => idx === undefined || idx === null || typeof idx === 'number';
        export const __wbindgen_is_undefined_or_null_or_boolean = (idx) => idx === undefined || idx === null || typeof idx === 'boolean';
        export const __wbindgen_is_undefined_or_null_or_function = (idx) => idx === undefined || idx === null || typeof idx === 'function';
        export const __wbindgen_is_undefined_or_null_or_symbol = (idx) => idx === undefined || idx === null || typeof idx === 'symbol';
        export const __wbindgen_is_undefined_or_null_or_bigint = (idx) => idx === undefined || idx === null || typeof idx === 'bigint';
      `
    }
  }
}

const config: UserConfig = {
  plugins: [
    react({
      // Ensure proper JSX runtime
      jsxRuntime: 'automatic',
      // Add babel configuration for better compatibility
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }),
    wasmBindgenPlugin
  ],
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; worker-src 'self' blob:;"
    }
  },
  resolve: {
    alias: {
      // Remove the placeholder alias as it's causing issues
    }
  },
  optimizeDeps: {
    exclude: ['puzzle-core']
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es',
        inlineDynamicImports: true
      }
    }
  }
}

export default defineConfig(config)
