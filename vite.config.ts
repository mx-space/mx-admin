import vue from '@vitejs/plugin-vue'
import { omitBy } from 'lodash'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import Checker from 'vite-plugin-checker'
import { execSync } from 'child_process'
const gitHash = execSync('git rev-parse --short HEAD', {
  encoding: 'utf-8',
}).split('\n')[0]
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
        enableBuild: true,
      }),
    ],

    build: {
      chunkSizeWarningLimit: 2500, //monaco is so big
      target: 'esnext',
      brotliSize: false,

      sourcemap: true,
      rollupOptions: {
        output: {
          chunkFileNames: `[name]-[hash]-${gitHash}.js`,
          entryFileNames: `[name]-${gitHash}.js`,
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
