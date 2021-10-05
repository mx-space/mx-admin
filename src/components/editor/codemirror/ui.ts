import { EditorView } from '@codemirror/view/dist'
import { githubDarkTheme } from '@ddietr/codemirror-themes/theme/github-dark'
import { githubLightTheme } from '@ddietr/codemirror-themes/theme/github-light'
import { useInjector } from 'hooks/use-deps-injection'
import { UIStore } from 'stores/ui'
import { Ref } from 'vue'
import { codemirrorReconfigureExtensionMap } from './extension'

export const useCodeMirrorAutoToggleTheme = (
  view: Ref<EditorView | undefined>,
) => {
  const { isDark } = useInjector(UIStore)
  watch(
    () => isDark.value,
    (isDark) => {
      if (!view.value) {
        return
      }

      if (isDark) {
        view.value.dispatch({
          effects: [
            codemirrorReconfigureExtensionMap.theme.reconfigure(
              githubDarkTheme,
            ),
          ],
        })
      } else {
        view.value.dispatch({
          effects: [
            codemirrorReconfigureExtensionMap.theme.reconfigure(
              githubLightTheme,
            ),
          ],
        })
      }
    },
  )
}
