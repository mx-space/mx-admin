import type { NestedDocDialogEditorProps } from '@haklex/rich-ext-nested-doc'

import { nestedDocEditNodes } from '@haklex/rich-ext-nested-doc'
import { ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'

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
