import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { API_URL } from '~/constants/env'

import {
  createShiroEditorBridgeElement,
  saveExcalidrawSnapshot,
} from './shiro-editor-bridge'

const { uploadMock, updateMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  updateMock: vi.fn(),
}))

vi.mock('~/api/files', () => ({
  filesApi: {
    upload: uploadMock,
    update: updateMock,
  },
}))

vi.mock('~/constants/env', () => ({
  API_URL: 'https://api.test',
}))

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

describe('shiro-editor-bridge', () => {
  beforeEach(() => {
    uploadMock.mockReset()
    updateMock.mockReset()
  })

  it('uploads a new excalidraw snapshot when no existing ref is provided', async () => {
    uploadMock.mockResolvedValue({ name: 'fresh-snapshot' })

    const result = await saveExcalidrawSnapshot({ elements: [] })

    expect(uploadMock).toHaveBeenCalledTimes(1)
    expect(updateMock).not.toHaveBeenCalled()
    expect(result).toBe('ref:file/fresh-snapshot')
  })

  it('updates an existing excalidraw snapshot when file ref already exists', async () => {
    updateMock.mockResolvedValue({ name: 'persisted-snapshot' })

    const result = await saveExcalidrawSnapshot(
      { elements: [] },
      'ref:file/existing-snapshot',
    )

    expect(updateMock).toHaveBeenCalledWith(
      'file',
      'existing-snapshot',
      expect.any(File),
    )
    expect(uploadMock).not.toHaveBeenCalled()
    expect(result).toBe('ref:file/persisted-snapshot')
  })

  it('wraps shiro editor with shared providers and appends nested doc nodes', () => {
    const tree = createShiroEditorBridgeElement({
      editorProps: {
        theme: 'dark',
        extraNodes: ['custom-node'] as any,
      } as any,
      onChange: vi.fn(),
      onSubmit: vi.fn(),
      onEditorReady: vi.fn(),
      children: [createElement('custom-child')],
    })

    const dialogProvider = tree
    const stackProvider = dialogProvider.props.children
    const excalidrawProvider = stackProvider.props.children
    const shiroEditor = excalidrawProvider.props.children

    expect(dialogProvider.props.value).toBeTypeOf('function')
    expect(excalidrawProvider.props.apiUrl).toBe(API_URL)
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
