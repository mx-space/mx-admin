import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ShiroEditorBridge } from './ShiroEditorBridge'

vi.mock('@haklex/rich-editor-ui', async () => {
  const { createElement } = await import('react')

  return {
    DialogStackProvider: (props: any) =>
      createElement('dialog-stack-provider', props, props.children),
  }
})

vi.mock('@haklex/rich-ext-nested-doc', async () => {
  const { createElement } = await import('react')

  return {
    nestedDocEditNodes: ['nested-a', 'nested-b'],
    NestedDocPlugin: () => createElement('nested-doc-plugin'),
    NestedDocDialogEditorProvider: (props: any) =>
      createElement('nested-doc-dialog-provider', props, props.children),
  }
})

vi.mock('@haklex/rich-kit-shiro', async () => {
  const { createElement } = await import('react')

  return {
    ExcalidrawConfigProvider: (props: any) =>
      createElement('excalidraw-config-provider', props, props.children),
    ShiroEditor: (props: any) =>
      createElement('shiro-editor', props, props.children),
  }
})

vi.mock('@haklex/rich-plugin-toolbar', async () => {
  const { createElement } = await import('react')

  return {
    ToolbarPlugin: () => createElement('toolbar-plugin'),
  }
})

describe('ShiroEditorBridge', () => {
  it('wraps shiro editor with shared providers and appends nested doc nodes', () => {
    const saveExcalidrawSnapshot = vi.fn(async () => 'ref:file/x')
    const apiUrl = 'https://api.test'

    const tree: any = ShiroEditorBridge({
      editorProps: {
        theme: 'dark',
        extraNodes: ['custom-node'] as any,
      } as any,
      saveExcalidrawSnapshot,
      apiUrl,
      onChange: vi.fn(),
      onSubmit: vi.fn(),
      onEditorReady: vi.fn(),
      children: createElement('custom-child'),
    })

    const dialogProvider = tree
    const stackProvider = dialogProvider.props.children
    const excalidrawProvider = stackProvider.props.children
    const shiroEditor = excalidrawProvider.props.children

    expect(dialogProvider.props.value).toBeTypeOf('function')
    expect(excalidrawProvider.props.apiUrl).toBe(apiUrl)
    expect(excalidrawProvider.props.saveSnapshot).toBe(saveExcalidrawSnapshot)
    expect(shiroEditor.props.extraNodes).toEqual([
      'custom-node',
      'nested-a',
      'nested-b',
    ])
    expect(shiroEditor.props.header.type).toBeTypeOf('function')
    expect(shiroEditor.props.children.type).toBe('custom-child')
  })
})
