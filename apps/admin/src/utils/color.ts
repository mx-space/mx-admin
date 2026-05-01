// Vercel 风格中性主题 - 固定配置，不可更改
// 使用 Tailwind neutral 色系替换 naive-ui 默认的带蓝调灰色

import type { GlobalThemeOverrides, ThemeCommonVars } from 'naive-ui'

// Tailwind neutral 色板
// neutral-50:  #fafafa
// neutral-100: #f5f5f5
// neutral-200: #e5e5e5
// neutral-300: #d4d4d4
// neutral-400: #a3a3a3
// neutral-500: #737373
// neutral-600: #525252
// neutral-700: #404040
// neutral-800: #262626
// neutral-900: #171717
// neutral-950: #0a0a0a

export const commonThemeVars: Partial<ThemeCommonVars> = {
  borderRadius: '6px',
}

// Light Mode: 深色主色调 + neutral 灰色系统
export const lightThemeColors = {
  // 主色调
  primaryColor: '#171717',
  primaryColorHover: '#404040',
  primaryColorPressed: '#0a0a0a',
  primaryColorSuppl: '#525252',

  // 文字颜色 - 使用 neutral 替换原有的带蓝调灰色
  textColor1: '#171717', // neutral-900 (原: rgb(31, 34, 37))
  textColor2: '#404040', // neutral-700 (原: rgb(51, 54, 57))
  textColor3: '#737373', // neutral-500 (原: rgb(118, 124, 130))

  // 边框和分割线
  dividerColor: '#e5e5e5', // neutral-200 (原: rgb(239, 239, 245))
  borderColor: '#e5e5e5', // neutral-200 (原: rgb(224, 224, 230))

  // 背景色
  railColor: '#d4d4d4', // neutral-300 (原: rgb(219, 219, 223))
  tagColor: '#f5f5f5', // neutral-100 (原: #eee)
  codeColor: '#f5f5f5', // neutral-100 (原: rgb(244, 244, 248))
  tabColor: '#fafafa', // neutral-50 (原: rgb(247, 247, 250))
  actionColor: '#fafafa', // neutral-50 (原: rgb(250, 250, 252))
  tableHeaderColor: '#fafafa', // neutral-50 (原: rgb(250, 250, 252))
  hoverColor: '#f5f5f5', // neutral-100 (原: rgb(243, 243, 245))
  pressedColor: '#e5e5e5', // neutral-200 (原: rgb(237, 237, 239))
  inputColorDisabled: '#fafafa', // neutral-50 (原: rgb(250, 250, 252))

  // 关闭按钮
  closeColorHover: 'rgba(23, 23, 23, 0.09)', // neutral-900 with alpha
  closeColorPressed: 'rgba(23, 23, 23, 0.13)', // neutral-900 with alpha

  // 次级按钮
  buttonColor2: 'rgba(23, 23, 23, 0.05)', // neutral-900 with alpha
  buttonColor2Hover: 'rgba(23, 23, 23, 0.09)',
  buttonColor2Pressed: 'rgba(23, 23, 23, 0.13)',

  // 表格
  tableColorHover: 'rgba(23, 23, 23, 0.03)',
  tableColorStriped: 'rgba(23, 23, 23, 0.02)',
} satisfies Partial<ThemeCommonVars>

// Dark Mode: 浅色主色调 + neutral 灰色系统
export const darkThemeColors = {
  // 主色调
  primaryColor: '#ededed',
  primaryColorHover: '#d4d4d4',
  primaryColorPressed: '#fafafa',
  primaryColorSuppl: '#a3a3a3',

  // 背景色 - 使用 neutral 替换原有的带蓝调灰色
  bodyColor: '#0a0a0a', // neutral-950 (原: rgb(16, 16, 20))
  cardColor: '#171717', // neutral-900 (原: rgb(24, 24, 28))
  modalColor: '#171717', // neutral-900 (原: rgb(44, 44, 50))
  popoverColor: '#262626', // neutral-800 (原: rgb(72, 72, 78))
  tableColor: '#171717', // neutral-900

  // 关闭按钮
  closeColorHover: 'rgba(255, 255, 255, 0.12)',
  closeColorPressed: 'rgba(255, 255, 255, 0.08)',

  // 次级按钮
  buttonColor2: 'rgba(255, 255, 255, 0.08)',
  buttonColor2Hover: 'rgba(255, 255, 255, 0.12)',
  buttonColor2Pressed: 'rgba(255, 255, 255, 0.08)',
} satisfies Partial<ThemeCommonVars>

// ============================================================
// 字号规范配置
// 统一 NaiveUI 组件字号，与 Tailwind 字号规范对齐
// ============================================================
// text-xs  = 12px (辅助文字、元数据、时间戳)
// text-sm  = 14px (正文、列表标题、按钮、表单标签)
// text-base = 16px (次级标题)
// text-lg  = 18px (卡片/Modal 标题)
// text-xl  = 20px (区块标题)
// text-2xl = 24px (页面大标题)
// ============================================================

export const componentThemeOverrides: GlobalThemeOverrides = {
  DataTable: {
    fontSizeSmall: '12px',
    fontSizeMedium: '14px',
    fontSizeLarge: '14px',
    thFontWeight: '500',
  },
  Form: {
    labelFontSizeTopSmall: '12px',
    labelFontSizeTopMedium: '14px',
    labelFontSizeTopLarge: '14px',
    labelFontSizeLeftSmall: '12px',
    labelFontSizeLeftMedium: '14px',
    labelFontSizeLeftLarge: '14px',
    feedbackFontSizeSmall: '12px',
    feedbackFontSizeMedium: '12px',
    feedbackFontSizeLarge: '14px',
  },
  Input: {
    fontSizeSmall: '12px',
    fontSizeMedium: '14px',
    fontSizeLarge: '14px',
  },
  Button: {
    fontSizeSmall: '12px',
    fontSizeMedium: '14px',
    fontSizeLarge: '14px',
    fontSizeTiny: '12px',
  },
  Card: {
    fontSizeSmall: '14px',
    fontSizeMedium: '14px',
    fontSizeLarge: '14px',
    titleFontSizeSmall: '16px',
    titleFontSizeMedium: '18px',
    titleFontSizeLarge: '18px',
  },
  Tag: {
    fontSizeSmall: '12px',
    fontSizeMedium: '12px',
    fontSizeLarge: '14px',
  },
  Select: {
    fontSizeSmall: '12px',
    fontSizeMedium: '14px',
    fontSizeLarge: '14px',
  },
  Tabs: {
    tabFontSizeSmall: '12px',
    tabFontSizeMedium: '14px',
    tabFontSizeLarge: '14px',
  },
}
