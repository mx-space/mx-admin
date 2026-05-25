// @vitest-environment node

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
    NestedDocDialogEditorProvider: (props: any) =>
      createElement('nested-doc-dialog-provider', props, props.children),
    NestedDocPlugin: () => createElement('nested-doc-plugin'),
    nestedDocEditNodes: ['nested-a', 'nested-b'],
  }
})

vi.mock('@haklex/rich-ext-excalidraw', async () => {
  const { createElement } = await import('react')

  return {
    ExcalidrawConfigProvider: (props: any) =>
      createElement('excalidraw-config-provider', props, props.children),
  }
})

vi.mock('../shiro', async () => {
  const { createElement } = await import('react')

  return {
    enhancedEditRendererConfig: {},
    enhancedRendererConfig: {},
    ShiroEditor: (props: any) =>
      createElement('shiro-editor', props, props.children),
  }
})

vi.mock('./EditorToolbar', async () => {
  const { createElement } = await import('react')

  return {
    EditorToolbar: () => createElement('editor-toolbar'),
  }
})

vi.mock('./setup-enrichment-linkcard', () => ({}))

describe('ShiroEditorBridge', () => {
  it('wraps shiro editor with shared providers and appends nested doc nodes', () => {
    const saveExcalidrawSnapshot = vi.fn(async () => 'ref:file/x')
    const apiUrl = 'https://api.test'

    const tree: any = ShiroEditorBridge({
      apiUrl,
      children: createElement('custom-child'),
      editorProps: {
        extraNodes: ['custom-node'] as any,
        theme: 'dark',
      } as any,
      onChange: vi.fn(),
      onEditorReady: vi.fn(),
      onSubmit: vi.fn(),
      saveExcalidrawSnapshot,
    })

    const enrichmentProvider = tree
    const dialogProvider = enrichmentProvider.props.children
    const stackProvider = dialogProvider.props.children
    const excalidrawProvider = stackProvider.props.children
    const shiroEditor = excalidrawProvider.props.children

    expect(enrichmentProvider.props.value).toBeNull()
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
