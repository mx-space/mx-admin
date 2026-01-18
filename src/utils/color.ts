// Vercel 风格中性主题 - 固定配置，不可更改

import type { ThemeCommonVars } from 'naive-ui'

export const commonThemeVars: Partial<ThemeCommonVars> = {
  borderRadius: '6px',
}

// Light Mode: 深色主色调
export const lightThemeColors = {
  primaryColor: '#171717',
  primaryColorHover: '#404040',
  primaryColorPressed: '#0a0a0a',
  primaryColorSuppl: '#525252',
} satisfies Partial<ThemeCommonVars>

// Dark Mode: 浅色主色调
export const darkThemeColors = {
  primaryColor: '#ededed',
  primaryColorHover: '#d4d4d4',
  primaryColorPressed: '#fafafa',
  primaryColorSuppl: '#a3a3a3',
  modalColor: '#171717',
} satisfies Partial<ThemeCommonVars>
