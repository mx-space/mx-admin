import type { NestedDocDialogEditorProps } from '@haklex/rich-ext-nested-doc'

import { nestedDocEditNodes } from '@haklex/rich-ext-nested-doc'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'

import { ShiroEditor } from '../shiro'

export function NestedDocDialogEditor({
  initialValue,
  onEditorReady,
}: NestedDocDialogEditorProps) {
  return (
    <ShiroEditor
      initialValue={initialValue}
      onEditorReady={onEditorReady}
      extraNodes={nestedDocEditNodes}
      header={<ToolbarPlugin />}
    />
  )
}
