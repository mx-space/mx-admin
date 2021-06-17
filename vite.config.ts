/*
 * @Author: Innei
 * @Date: 2021-03-21 21:31:08
 * @LastEditTime: 2021-03-22 11:27:56
 * @LastEditors: Innei
 * @FilePath: /admin-next/vite.config.ts
 * Mark: Coding with Love
 */
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { omitBy } from 'lodash'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default ({ mode }) => {
  process.env = {
    ...process.env,
    ...omitBy(loadEnv(mode, process.cwd()), Boolean),
  }

  return defineConfig({
    plugins: [vue(), tsconfigPaths(), visualizer({ open: false })],
    // build: {
    // minify: false,
    // sourcemap: true,
    // },
    define: {
      __DEV__: process.env.NODE_ENV !== 'production',
    },
    base:
      process.env.NODE_ENV === 'production'
        ? process.env.VITE_APP_PUBLIC_URL || ''
        : '',

    server: {
      port: 9528,
    },
    esbuild: {
      jsxFactory: 'h',
      jsxInject: 'import {h,Fragment} from "vue"',
      jsxFragment: 'Fragment',
    },
  })
}
