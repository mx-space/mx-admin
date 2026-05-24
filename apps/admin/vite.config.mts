import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import { loadEnv } from 'vite'
import { checker } from 'vite-plugin-checker'
import { defineConfig } from 'vitest/config'
import type { PluginOption } from 'vite'

import PKG from './package.json'

// dns.setDefaultResultOrder('verbatim')
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_APP_PUBLIC_URL } = env
  const isDev = mode === 'development'

  return defineConfig({
    plugins: [
      // mkcert(),
      UnoCSS(),
      react(),

      checker({
        enableBuild: true,
      }),
      htmlPlugin(env),
      // nodePolyfills({
      //   // To exclude specific polyfills, add them to this list.
      //   exclude: [
      //     'fs', // Excludes the polyfill for `fs` and `node:fs`.
      //   ],
      //   // Whether to polyfill `node:` protocol imports.
      //   protocolImports: true,
      // }),
    ],

    resolve: {
      tsconfigPaths: true,
      alias: {
        path: 'path-browserify',
        os: 'os-browserify',
        'node-fetch': 'isomorphic-fetch',
        buffer: 'buffer',
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
    oxc: {
      jsx: {
        runtime: 'automatic',
        importSource: 'react',
      },
    },
    test: {
      environment: 'happy-dom',
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
