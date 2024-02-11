import { viteExternalsPlugin as ViteExternals } from 'vite-plugin-externals'
import { createHtmlPlugin } from 'vite-plugin-html'
import type { HtmlTagDescriptor } from 'vite'

import { dependencies } from './package.json'

/**
 * It copies the external libraries to the `assets` folder, and injects the script tags into the HTML
 *
 * @param {boolean} isProduction - boolean
 * @param {string} baseUrl - The base url of the application.
 * @returns An array of plugins
 */
export const setupLibraryExternal = (
  isProduction: boolean,
  baseUrl: string,
) => {
  
  const cdnUrl = 'https://unpkg.com/'

  const staticTargets: { dev: string; prod: string }[] = [
    {
      dev: `./node_modules/vue/dist/vue.global${
        isProduction ? '.prod' : ''
      }.js`,
      prod: `${cdnUrl}vue@${dependencies.vue}/dist/vue.global.prod.js`,
    },
    {
      dev: `./node_modules/vue-router/dist/vue-router.global${
        isProduction ? '.prod' : ''
      }.js`,
      prod: `${cdnUrl}vue-router@${dependencies['vue-router']}/dist/vue-router.global.prod.js`,
    },

    {
      dev: `./node_modules/vue-demi/lib/index.iife.js`,
      prod: `${cdnUrl}vue-demi@0.14.6/lib/index.iife.js`,
    },
    {
      dev: './node_modules/@vueuse/shared/index.iife.min.js',
      prod: `${cdnUrl}@vueuse/shared@${dependencies['@vueuse/shared']}/index.iife.min.js`,
    },
    {
      dev: './node_modules/@vueuse/core/index.iife.min.js',
      prod: `${cdnUrl}@vueuse/core@${dependencies['@vueuse/core']}/index.iife.min.js`,
    },
    {
      dev: './node_modules/@vueuse/components/index.iife.min.js',
      prod: `${cdnUrl}@vueuse/components@${dependencies['@vueuse/components']}/index.iife.min.js`,
    },
  ]

  const injectTags = staticTargets
    .map((target) => {
      return {
        injectTo: 'head',
        tag: 'script',
        attrs: {
          src: isProduction ? target.prod : target.dev,
          type: 'text/javascript',
        },
      }
    })
    .filter(Boolean) as HtmlTagDescriptor[]

  return [
    ViteExternals({
      vue: 'Vue',
      'vue-router': 'VueRouter',

      '@vueuse/core': 'VueUse',
      '@vueuse/components': 'VueUse',

      'vue-demi': 'VueDemi',
    }),

    createHtmlPlugin({
      minify: false,
      inject: {
        tags: injectTags,
      },
    }),
  ]
}