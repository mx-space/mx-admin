import type { Plugin } from 'vite'

export function VitePluginBundlerKit(manifest: any): Plugin {
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
            formats: ['iife'],
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
