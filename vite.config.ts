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
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
export default defineConfig({
  plugins: [
    vue(),
    tsconfigPaths(),
    visualizer({ open: false }),

    // vueJsx({})
  ],
  server: {
    port: 9528,
  },
  esbuild: {
    jsxFactory: 'h',
    jsxInject: 'import {h,Fragment} from "vue"',
    jsxFragment: 'Fragment',
  },
})
