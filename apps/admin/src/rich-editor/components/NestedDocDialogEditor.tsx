import type { NestedDocDialogEditorProps } from '@haklex/rich-ext-nested-doc'

import { nestedDocEditNodes } from '@haklex/rich-ext-nested-doc'

import { ShiroEditor } from '../shiro'
import { EditorToolbar } from './EditorToolbar'

export function NestedDocDialogEditor({
  initialValue,
  onEditorReady,
}: NestedDocDialogEditorProps) {
  return (
    <ShiroEditor
      initialValue={initialValue}
      onEditorReady={onEditorReady}
      extraNodes={nestedDocEditNodes}
      header={<EditorToolbar />}
    />
  )
}
