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
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 9528,
  },
  esbuild: {
    jsxFactory: 'h',
    jsxInject: 'import {h,Fragment} from "vue"',
    jsxFragment: 'Fragment',
  },
})
