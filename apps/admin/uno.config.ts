import presetTypography from '@unocss/preset-typography'

import {
  defineConfig,
  presetAttributify,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
    presetTypography({
      cssExtend: {
        // 自定义 prose 样式
        p: {
          'margin-top': '1.25em',
          'margin-bottom': '1.25em',
        },
      },
    }),
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  theme: {
    colors: {
      primary: {
        DEFAULT: 'var(--color-primary)',
        deep: 'var(--color-primary-deep)',
        shallow: 'var(--color-primary-shallow)',
      },
      'gray-custom': {
        DEFAULT: '#ddd',
      },
    },
    breakpoints: {
      phone: '768px',
      tablet: '1023px',
      desktop: '1024px',
    },
    zIndex: {
      1: '1',
      60: '60',
      70: '70',
      80: '80',
      90: '90',
      100: '100',
    },
  },
  shortcuts: {
    // 可以在这里定义快捷方式
  },
  rules: [
    // 自定义规则
    ['rounded-naive', { 'border-radius': 'var(--border-radius)' }],
    [
      /^phone:(.+)$/,
      ([, c], { rawSelector }) => {
        return `@media (max-width: 768px) { ${rawSelector} { ${c} } }`
      },
    ],
  ],
  variants: [
    // 自定义 phone 变体
    (matcher) => {
      if (!matcher.startsWith('phone:')) return matcher
      return {
        matcher: matcher.slice(6),
        parent: '@media (max-width: 768px)',
      }
    },
    // 自定义 desktop 变体
    (matcher) => {
      if (!matcher.startsWith('desktop:')) return matcher
      return {
        matcher: matcher.slice(8),
        parent: '@media (min-width: 1024px)',
      }
    },
    // 自定义 tablet 变体
    (matcher) => {
      if (!matcher.startsWith('tablet:')) return matcher
      return {
        matcher: matcher.slice(7),
        parent: '@media (max-width: 1023px)',
      }
    },
  ],
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/],
    },
  },
})
