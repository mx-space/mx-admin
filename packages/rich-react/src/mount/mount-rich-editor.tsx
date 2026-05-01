import { createRoot } from 'react-dom/client'
import type { LexicalEditor, SerializedEditorState } from 'lexical'
import type { SaveExcalidrawSnapshot } from '../types'
import type { BuildShiroEditorPropsInput } from '../utils/build-shiro-editor-props'

import { NestedDocPlugin } from '@haklex/rich-ext-nested-doc'
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'

import { ShiroEditorBridge } from '../components/ShiroEditorBridge'
import { buildShiroEditorProps } from '../utils/build-shiro-editor-props'

export interface MountRichEditorOptions extends BuildShiroEditorPropsInput {
  theme: 'dark' | 'light'
  saveExcalidrawSnapshot: SaveExcalidrawSnapshot
  apiUrl: string
  onChange?: (value: SerializedEditorState) => void
  onSubmit?: () => void
  onEditorReady?: (editor: LexicalEditor | null) => void
  onTextChange?: (text: string) => void
}

export interface RichEditorHandle {
  update(opts: MountRichEditorOptions): void
  unmount(): void
  getEditor(): LexicalEditor | null
  focus(): void
}

export function mountRichEditor(
  container: HTMLElement,
  initial: MountRichEditorOptions,
): RichEditorHandle {
  const root = createRoot(container)
  let editorInstance: LexicalEditor | null = null
  let current = initial
  let unmounted = false

  const handleChange = (value: SerializedEditorState) => {
    if (unmounted) return
    current.onChange?.(value)
    if (editorInstance && current.onTextChange) {
      const cb = current.onTextChange
      editorInstance.read(() => cb($convertToMarkdownString(TRANSFORMERS)))
    }
  }

  const handleSubmit = () => {
    if (unmounted) return
    current.onSubmit?.()
  }

  const handleEditorReady = (editor: LexicalEditor | null) => {
    if (unmounted) return
    editorInstance = editor
    current.onEditorReady?.(editor)
    if (editor && current.onTextChange) {
      const cb = current.onTextChange
      editor.read(() => cb($convertToMarkdownString(TRANSFORMERS)))
    }
  }

  const render = (opts: MountRichEditorOptions) => {
    const editorProps = buildShiroEditorProps(opts.theme, opts)
    root.render(
      <ShiroEditorBridge
        editorProps={editorProps}
        saveExcalidrawSnapshot={opts.saveExcalidrawSnapshot}
        apiUrl={opts.apiUrl}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onEditorReady={handleEditorReady}
      >
        <NestedDocPlugin />
      </ShiroEditorBridge>,
    )
  }

  render(initial)

  return {
    update(opts) {
      current = opts
      render(opts)
    },
    unmount() {
      unmounted = true
      root.unmount()
      editorInstance = null
    },
    getEditor() {
      return editorInstance
    },
    focus() {
      editorInstance?.focus()
    },
  }
}
