import { createElement } from 'react'
import type { NestedDocDialogEditorProps } from '@haklex/rich-ext-nested-doc'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type { LexicalEditor } from 'lexical'

import { DialogStackProvider } from '@haklex/rich-editor-ui'
import {
  NestedDocDialogEditorProvider,
  nestedDocEditNodes,
} from '@haklex/rich-ext-nested-doc'
import { ExcalidrawConfigProvider, ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'

import { filesApi } from '~/api/files'
import { API_URL } from '~/constants/env'

export async function saveExcalidrawSnapshot(
  snapshot: object,
  existingRef?: string,
): Promise<string> {
  const blob = new Blob([JSON.stringify(snapshot)], {
    type: 'application/json',
  })
  const file = new File([blob], 'snapshot.excalidraw', {
    type: 'application/json',
  })

  if (existingRef?.startsWith('ref:file/')) {
    const name = existingRef.slice(9)
    const result = await filesApi.update('file', name, file)
    return `ref:file/${result.name}`
  }

  const result = await filesApi.upload(file, 'file')
  return `ref:file/${result.name}`
}

export function NestedDocDialogEditor({
  initialValue,
  onEditorReady,
}: NestedDocDialogEditorProps) {
  return createElement(ShiroEditor, {
    initialValue,
    onEditorReady,
    extraNodes: nestedDocEditNodes,
    header: createElement(ToolbarPlugin),
  })
}

export function createShiroEditorBridgeElement(options: {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  onChange?: ShiroEditorProps['onChange']
  onSubmit?: ShiroEditorProps['onSubmit']
  onEditorReady?: (editor: LexicalEditor | null) => void
  children?: unknown[]
}) {
  return createElement(
    NestedDocDialogEditorProvider,
    { value: NestedDocDialogEditor },
    createElement(
      DialogStackProvider,
      null,
      createElement(
        ExcalidrawConfigProvider,
        {
          saveSnapshot: saveExcalidrawSnapshot,
          apiUrl: API_URL,
        },
        createElement(
          ShiroEditor,
          {
            ...options.editorProps,
            extraNodes: [
              ...(options.editorProps.extraNodes || []),
              ...nestedDocEditNodes,
            ],
            header: createElement(ToolbarPlugin),
            onChange: options.onChange,
            onSubmit: options.onSubmit,
            onEditorReady: options.onEditorReady,
          },
          ...(options.children ?? []),
        ),
      ),
    ),
  )
}
