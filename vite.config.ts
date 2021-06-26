import vue from '@vitejs/plugin-vue'
import { omitBy } from 'lodash'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import compress from 'vite-plugin-compress'
import tsconfigPaths from 'vite-tsconfig-paths'

export default ({ mode }) => {
  process.env = {
    ...process.env,
    ...omitBy(loadEnv(mode, process.cwd()), Boolean),
  }

  return defineConfig({
    plugins: [
      vue(),
      tsconfigPaths(),
      visualizer({ open: false }),
      compress({ verbose: true }),
    ],

    build: {
      chunkSizeWarningLimit: 2500, //monaco is so big
      target: 'esnext',
      brotliSize: false,
      // rollupOptions: { output: { minifyInternalExports: true } },
    },
    optimizeDeps: {
      exclude: [],
    },

    define: {
      __DEV__: process.env.NODE_ENV !== 'production',
    },
    base:
      process.env.NODE_ENV === 'production'
        ? process.env.VITE_APP_PUBLIC_URL || ''
        : '',

    server: {
      // https: true,
      port: 9528,
    },
    esbuild: {
      jsxFactory: 'h',
      jsxInject: 'import {h,Fragment} from "vue"',
      jsxFragment: 'Fragment',
    },
  })
}
