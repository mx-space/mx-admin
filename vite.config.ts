import vue from '@vitejs/plugin-vue'
import { omitBy } from 'lodash'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import Checker from 'vite-plugin-checker'
import format from 'date-fns/format'
const now = new Date()
const formatDate = format(now, 'h_mm_ss')
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
      Checker({
        typescript: true,
        // FIXME this is bug
        enableBuild: false,
      }),
    ],

    build: {
      chunkSizeWarningLimit: 2500, //monaco is so big
      target: 'esnext',
      brotliSize: false,

      sourcemap: true,
      rollupOptions: {
        output: {
          chunkFileNames: `[name]-[hash]-${formatDate}.js`,
          entryFileNames: `[name]-${formatDate}.js`,
        },
      },
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
