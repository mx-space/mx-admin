import { useInjector } from 'hooks/use-deps-injection'
import { UIStore } from 'stores/ui'
import Dark from './theme/dark.json'
import Light from './theme/light.json'
const set = new Set()
export const useDefineTheme = (
  theme: string,
  json: any,
  cb: (m: any) => any,
) => {
  if (set.has(theme)) {
    return
  }

  onMounted(() => {
    import('monaco-editor').then((monaco) => {
      monaco.editor.defineTheme(theme, json)
      set.add(theme)

      cb(monaco)
    })
  })
}

export const useDefineMyThemes = () => {
  const ui = useInjector(UIStore)
  const isDark = ui.isDark
  const cb = (monaco: any) => {
    if (isDark.value) {
      monaco.editor.setTheme('dark')
    } else {
      monaco.editor.setTheme('light')
    }
  }
  useDefineTheme('light', Light, cb)
  useDefineTheme('dark', Dark, cb)
}
