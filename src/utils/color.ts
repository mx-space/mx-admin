import tinycolor from 'tinycolor2'

import { ThemeColorConfig } from '~/../theme.config'

export const colorRef = useStorage('mx-admin-color', ThemeColorConfig)

interface Colors {
  primaryColor: string
  primaryColorHover: string
  primaryColorPressed: string
  primaryColorSuppl: string
}

export function defineColors(baseColor: string): Colors {
  const base = tinycolor(baseColor)

  const primaryColor = base.toHexString()
  const primaryColorHover = base.brighten(10).toHexString()
  const primaryColorPressed = base.darken(10).toHexString()
  const primaryColorSuppl = base.darken(15).toHexString()

  return {
    primaryColor,
    primaryColorHover,
    primaryColorPressed,
    primaryColorSuppl,
  }
}
