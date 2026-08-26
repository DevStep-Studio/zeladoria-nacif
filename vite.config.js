import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import {fileURLToPath, URL} from 'node:url'

const useBase44Plugin = process.env.VITE_DATA_PROVIDER !== 'rest' && process.env.VITE_DISABLE_BASE44_PLUGIN !== 'true';

const createBase44Plugins = async () => {
  if (!useBase44Plugin) return [];

  const {default: base44} = await import("@base44/vite-plugin");
  return [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
  ];
};

// https://vite.dev/config/
export default defineConfig(async () => ({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false, // Desativa source maps para proteger o código-fonte original
    minify: 'esbuild',
    chunkSizeWarningLimit: 1200,
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [
    ...(await createBase44Plugins()),
    react(),
  ]
}));

