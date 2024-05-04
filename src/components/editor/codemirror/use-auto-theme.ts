import { useStoreRef } from 'hooks/use-store-ref'
import { UIStore } from 'stores/ui'

import { oneDark } from '@codemirror/theme-one-dark'
import { githubLight } from '@ddietr/codemirror-themes/theme/github-light'

import { codemirrorReconfigureExtensionMap } from './extension'
import type { Ref } from 'vue'
import type { EditorView } from '@codemirror/view/dist'

export const useCodeMirrorAutoToggleTheme = (
  view: Ref<EditorView | undefined>,
) => {
  const { isDark } = useStoreRef(UIStore)
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
