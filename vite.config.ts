import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import Checker from 'vite-plugin-checker'
import WindiCSS from 'vite-plugin-windicss'
import tsconfigPaths from 'vite-tsconfig-paths'
import PKG from './package.json'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_APP_PUBLIC_URL } = env
  const isDev = mode === 'development'

  return defineConfig({
    plugins: [
      // vueJsx(),
      WindiCSS(),
      vue(),
      tsconfigPaths(),
      visualizer({ open: false }),
      Checker({
        typescript: true,
        enableBuild: true,
      }),
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue\??/, // .vue
        ],
        dts: true,
        imports: ['vue'],
      }),
      htmlPlugin(env),
    ],

    build: {
      chunkSizeWarningLimit: 2500, //monaco is so big
      target: 'esnext',
      brotliSize: false,

      // sourcemap: true,
      rollupOptions: {
        output: {
          chunkFileNames: `js/[name].js`,
          entryFileNames: `js/[name].js`,
        },
      },
    },
    optimizeDeps: {
      exclude: [],
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
        .replace(/\@gh\-pages/g, '@page_v' + PKG.version)
        .replace(
          '<!-- ENV INJECT -->',
          `<script>window.injectData = {WEB_URL:'${
            env.VITE_APP_WEB_URL || ''
          }', GATEWAY: '${env.VITE_APP_GATEWAY || ''}',BASE_API: '${
            env.VITE_APP_BASE_API || ''
          }'}</script>`,
        )
    },
  }
}
