/*
 * @Author: Innei
 * @Date: 2021-03-21 21:31:08
 * @LastEditTime: 2021-03-22 11:27:56
 * @LastEditors: Innei
 * @FilePath: /admin-next/vite.config.ts
 * Mark: Coding with Love
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import analyze from 'rollup-plugin-analyzer'
import { writeFileSync } from 'fs'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'
export default defineConfig({
  plugins: [
    vue(),
    tsconfigPaths(),
    analyze({
      writeTo: res => {
        writeFileSync(resolve(__dirname, 'bundle-analyze'), res, {
          encoding: 'utf-8',
        })
      },
    }),
    vueJsx(),
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
