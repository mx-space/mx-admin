import externalGlobals from 'rollup-plugin-external-globals'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import type { Plugin } from 'vite'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

function VitePluginBundlerKit(manifest: any): Plugin {
  return {
    name: 'plugin-bundler-kit',
    config(config, env) {
      return {
        ...config,
        define: {
          'process.env': process.env,
        },
        build: {
          emptyOutDir: true,
          lib: {
            entry: 'src/index.ts',
            name: manifest.metadata.name,
            formats: ['esm'],
            fileName: () => 'main.js',
          },
          rollupOptions: {
            external: [
              'vue',
              'vue-router',
              '@vueuse/core',
              '@vueuse/components',
            ],
            output: {
              globals: {
                vue: 'Vue',
                'vue-router': 'VueRouter',
                '@vueuse/core': 'VueUse',
                '@vueuse/components': 'VueUse',
              },
              extend: true,
            },
          },
        },
      }
    },
  }
}

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    tsconfigPaths(),
    VitePluginBundlerKit({
      metadata: {
        name: 'hello',
      },
    }),
    // replaceImportsToGlobal({
    //   include: 'src/**/*.tsx', // 根据需要调整
    //   // ... 其他选项
    // }),
  ],
  build: {
    rollupOptions: {
      plugins: [
        externalGlobals({
          vue: 'Vue',
        }),
      ],
    },
  },
})
