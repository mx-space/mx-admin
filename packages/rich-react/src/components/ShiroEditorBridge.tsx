import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type { LexicalEditor } from 'lexical'
import type { ReactNode } from 'react'
import type { SaveExcalidrawSnapshot } from '../types'

import { DialogStackProvider } from '@haklex/rich-editor-ui'
import {
  NestedDocDialogEditorProvider,
  nestedDocEditNodes,
} from '@haklex/rich-ext-nested-doc'
import { ExcalidrawConfigProvider, ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'

import { NestedDocDialogEditor } from './NestedDocDialogEditor'

export interface ShiroEditorBridgeProps {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  saveExcalidrawSnapshot: SaveExcalidrawSnapshot
  apiUrl: string
  onChange?: ShiroEditorProps['onChange']
  onSubmit?: ShiroEditorProps['onSubmit']
  onEditorReady?: (editor: LexicalEditor | null) => void
  children?: ReactNode
}

export function ShiroEditorBridge({
  editorProps,
  saveExcalidrawSnapshot,
  apiUrl,
  onChange,
  onSubmit,
  onEditorReady,
  children,
}: ShiroEditorBridgeProps) {
  return (
    <NestedDocDialogEditorProvider value={NestedDocDialogEditor}>
      <DialogStackProvider>
        <ExcalidrawConfigProvider
          saveSnapshot={saveExcalidrawSnapshot}
          apiUrl={apiUrl}
        >
          <ShiroEditor
            {...editorProps}
            extraNodes={[
              ...(editorProps.extraNodes || []),
              ...nestedDocEditNodes,
            ]}
            header={<ToolbarPlugin />}
            onChange={onChange}
            onSubmit={onSubmit}
            onEditorReady={onEditorReady}
          >
            {children}
          </ShiroEditor>
        </ExcalidrawConfigProvider>
      </DialogStackProvider>
    </NestedDocDialogEditorProvider>
  )
}
