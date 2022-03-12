import Dark from './theme/dark.json'
import Light from './theme/light.json'
const set = new Set()
export const useDefineTheme = (theme: string, json: any) => {
  if (set.has(theme)) {
    return
  }
  onMounted(() => {
    import('monaco-editor').then((monaco) => {
      monaco.editor.defineTheme(theme, json)
      set.add(theme)
    })
  })
}

export const useDefineMyThemes = () => {
  useDefineTheme('light', Light)
  useDefineTheme('dark', Dark)
}
