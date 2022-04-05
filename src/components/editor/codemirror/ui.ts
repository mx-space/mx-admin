import { useInjector } from 'hooks/use-deps-injection'
import { UIStore } from 'stores/ui'
import { Ref } from 'vue'

import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view/dist'
import { githubLight } from '@ddietr/codemirror-themes/theme/github-light'

import { codemirrorReconfigureExtensionMap } from './extension'

export const useCodeMirrorAutoToggleTheme = (
  view: Ref<EditorView | undefined>,
) => {
  const { isDark } = useInjector(UIStore)
  watch(
    [isDark, view],
    ([isDark]) => {
      if (!view.value) {
        return
      }

      if (isDark) {
        view.value.dispatch({
          effects: [
            codemirrorReconfigureExtensionMap.theme.reconfigure(oneDark),
          ],
        })
      } else {
        view.value.dispatch({
          effects: [
            codemirrorReconfigureExtensionMap.theme.reconfigure(githubLight),
          ],
        })
      }
    },

    { immediate: true, flush: 'post' },
  )
}
