import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import type { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

import { useEditorConfig } from '../universal/use-editor-setting'
import { codemirrorReconfigureExtensionMap } from './extension'

export const monospaceFonts = `"OperatorMonoSSmLig Nerd Font","Cascadia Code PL","FantasqueSansMono Nerd Font","operator mono","Fira code Retina","Fira code","Consolas", Monaco, "Hannotate SC", monospace, -apple-system`

const markdownTags = [
  tags.heading1,
  tags.heading2,
  tags.heading3,
  tags.heading4,
  tags.heading5,
  tags.heading6,
  tags.strong,
  tags.emphasis,
  tags.deleted,
  tags.content,
  tags.url,
  tags.link,
]

export const useCodeMirrorConfigureFonts = (
  editorView: Ref<EditorView | undefined>,
) => {
  const { general } = useEditorConfig()

  watch(
    () => [general.setting.fontFamily, editorView.value],
    ([fontFamily]) => {
      if (!editorView.value) return
      const sansFonts = fontFamily || 'var(--sans-font)'

      const fontStyles = HighlightStyle.define([
        {
          tag: tags.processingInstruction,
          fontFamily: monospaceFonts,
        },

        ...markdownTags.map((tag) => ({ tag, fontFamily: sansFonts })),
      ])

      editorView.value.dispatch({
        effects: [
          codemirrorReconfigureExtensionMap.fonts.reconfigure([
            syntaxHighlighting(fontStyles),
          ]),
        ],
      })
    },
    {
      immediate: true,
      flush: 'post',
    },
  )
}
