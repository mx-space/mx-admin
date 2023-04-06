import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import type { PluginOption } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import Checker from 'vite-plugin-checker'
import wasm from 'vite-plugin-wasm'
import WindiCSS from 'vite-plugin-windicss'
import tsconfigPaths from 'vite-tsconfig-paths'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

import PKG from './package.json'

// dns.setDefaultResultOrder('verbatim')
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_APP_PUBLIC_URL } = env
  const isDev = mode === 'development'

  return defineConfig({
    plugins: [
      wasm(),
      vueJsx(),
      WindiCSS(),
      vue({
        reactivityTransform: true,
      }),
      tsconfigPaths(),
      visualizer({ open: process.env.CI ? false : true }),

      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue\??/, // .vue
        ],
        dts: './src/auto-import.d.ts',
        imports: ['vue', 'pinia', '@vueuse/core'],
      }),
      Checker({
        enableBuild: true,
      }),
      htmlPlugin(env),
    ],

    resolve: {
      alias: {
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify'),
        'node-fetch': 'isomorphic-fetch',
      },
    },

    build: {
      chunkSizeWarningLimit: 2500,
      target: 'esnext',

      // sourcemap: true,
      rollupOptions: {
        output: {
          chunkFileNames: `js/[name]-[hash].js`,
          entryFileNames: `js/[name]-[hash].js`,
        },
      },
    },
    optimizeDeps: {
      exclude: ['@huacnlee/autocorrect', '@dqbd/tiktoken'],
    },

    define: {
      __DEV__: isDev,
    },
    base: !isDev ? VITE_APP_PUBLIC_URL || '' : '',

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

const htmlPlugin: (env: any) => PluginOption = (env) => {
  return {
    name: 'html-transform',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(
          '<!-- MX SPACE ADMIN DASHBOARD VERSION INJECT -->',
          `<script>window.version = '${PKG.version}';</script>`,
        )
        .replace(/@gh-pages/g, `@page_v${PKG.version}`)
        .replace(
          '<!-- ENV INJECT -->',
          `<script id="env_injection">window.injectData = {WEB_URL:'${
            env.VITE_APP_WEB_URL || ''
          }', GATEWAY: '${env.VITE_APP_GATEWAY || ''}',BASE_API: '${
            env.VITE_APP_BASE_API || ''
          }'}</script>`,
        )
    },
  }
}
