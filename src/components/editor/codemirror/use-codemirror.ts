import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { markdownKeymap } from '@codemirror/lang-markdown'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { search, searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'

import { useEditorConfig } from '../universal/use-editor-setting'
import { codemirrorReconfigureExtension } from './extension'
import { syntaxTheme } from './syntax-highlight'
import { useCodeMirrorConfigureFonts } from './use-auto-fonts'
import { useCodeMirrorAutoToggleTheme } from './use-auto-theme'
import {
  addUpload,
  removeUpload,
  uploadStateField,
} from './use-upload-extensions'

interface Props {
  initialDoc: string
  onChange?: (state: EditorState) => void
  onUploadImage?: (file: File) => Promise<string>
}

export const useCodeMirror = <T extends Element>(
  props: Props,
): [Ref<T | undefined>, Ref<EditorView | undefined>] => {
  const refContainer = ref<T>()
  const editorView = ref<EditorView>()
  const { general } = useEditorConfig()
  const { onChange, onUploadImage } = props

  const format = () => {
    const ev = editorView.value
    const autocorrect = general.setting.autocorrect

    if (autocorrect && ev) {
      import('@huacnlee/autocorrect')
        .then(({ formatFor }) => {
          const { state, dispatch } = ev
          const currentLine = state.doc.lineAt(state.selection.main.head)
          if (currentLine.text) {
            return
          }

          const allLineBeforeCurrentLine = state.doc.sliceString(
            0,
            currentLine.from,
          )
          const format = (text: string) => {
            return formatFor(text, 'cm.md').out as string
          }
          const newText = format(allLineBeforeCurrentLine)

          const delta = newText.length - allLineBeforeCurrentLine.length

          const afterCurrentLine = state.doc.sliceString(
            currentLine.to,
            state.doc.length,
          )
          const newAfterCurrentLine = format(afterCurrentLine)

          dispatch({
            changes: {
              from: 0,
              to: state.doc.length,
              insert: newText + newAfterCurrentLine,
            },
            selection: {
              anchor: state.selection.main.anchor + delta,
            },
          })
        })
        .catch(() => {
          console.log('not support wasm')
        })
    }
  }

  const handleImageUpload = (
    file: File,
    view: EditorView,
    insertPos: number,
  ) => {
    if (!onUploadImage) return

    const uploadId = crypto.randomUUID()
    view.dispatch({
      effects: addUpload.of({ id: uploadId, pos: insertPos }),
    })

    onUploadImage(file)
      .then((url) => {
        const state = view.state
        const decorations = state.field(uploadStateField)
        let foundFrom: number | null = null

        decorations.between(0, state.doc.length, (from, to, value) => {
          if (value.spec.id === uploadId) {
            foundFrom = from
            return false // find the decoration by the id set before
          }
        })

        if (foundFrom !== null) {
          // replace the widget with the actual image markdown
          view.dispatch({
            changes: {
              from: foundFrom,
              insert: `![${file.name}](${url})`,
            },
            effects: removeUpload.of({ id: uploadId }),
          })
          message.success('自动上传图片成功~')
        }
      })
      .catch((err) => {
        view.dispatch({
          effects: removeUpload.of({ id: uploadId }),
        })
      })
  }

  // handle paste event
  const handlePaste = (event: ClipboardEvent, view: EditorView) => {
    if (!onUploadImage) return

    const files = event.clipboardData?.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) return

    event.preventDefault()
    const insertPos = view.state.selection.main.head
    handleImageUpload(file, view, insertPos)
  }
  onMounted(() => {
    if (!refContainer.value) return

    const startState = EditorState.create({
      doc: props.initialDoc,
      extensions: [
        uploadStateField,

        EditorView.domEventHandlers({
          paste: (event, view) => handlePaste(event, view),
          drop: (event, view) => {
            if (!onUploadImage) return

            const files = event.dataTransfer?.files
            if (!files || files.length === 0) return

            const file = files[0]
            if (!file.type.startsWith('image/')) return

            event.preventDefault()

            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
            if (pos === null) return
            view.dispatch({ selection: { anchor: pos } })
            handleImageUpload(file, view, pos)
          },
        }),
        keymap.of([
          {
            key: 'Mod-s',
            run() {
              return false
            },
            preventDefault: true,
          },
          {
            key: 'Enter',
            run() {
              requestAnimationFrame(format)
              return false
            },
          },
        ]),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...markdownKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),

        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        EditorState.tabSize.of(2),
        search({
          top: true,
        }),

        syntaxTheme,

        ...codemirrorReconfigureExtension,

        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.changes) {
            onChange && onChange(update.state)
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: refContainer.value,
    })

    editorView.value = view
  })

  useCodeMirrorAutoToggleTheme(editorView)
  useCodeMirrorConfigureFonts(editorView)

  onBeforeUnmount(() => {
    editorView.value?.destroy()
  })

  return [refContainer, editorView]
}
