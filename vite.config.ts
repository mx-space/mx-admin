import vue from '@vitejs/plugin-vue'
import { omitBy } from 'lodash'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import Checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'
import PKG from './package.json'

// const gitHash = execSync('git rev-parse --short HEAD', {
//   encoding: 'utf-8',
// }).split('\n')[0]
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
      htmlPlugin(),
    ],

    build: {
      chunkSizeWarningLimit: 2500, //monaco is so big
      target: 'esnext',
      brotliSize: false,

      // sourcemap: true,
      rollupOptions: {
        output: {
          chunkFileNames: `[name].js`,
          entryFileNames: `[name].js`,
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

const htmlPlugin: () => PluginOption = () => {
  return {
    name: 'html-transform',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(
          '<!-- MX SPACE ADMIN DASHBOARD VERSION INJECT -->',
          `<!-- v${PKG.version} -->`,
        )
        .replace(/\@gh\-pages/g, '@page_v' + PKG.version)
    },
  }
}
