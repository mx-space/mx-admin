import { describe, expect, it } from 'vitest'

import { buildShiroEditorProps } from './build-shiro-editor-props'

describe('buildShiroEditorProps', () => {
  it('keeps theme, copies defined editor props, and maps editorStyle to style', () => {
    const result = buildShiroEditorProps('dark', {
      initialValue: {
        root: {
          type: 'root',
          version: 1,
          children: [],
          direction: null,
          format: '',
          indent: 0,
        },
      } as any,
      placeholder: 'Write here',
      variant: 'article',
      autoFocus: true,
      className: 'editor-shell',
      contentClassName: 'editor-content',
      debounceMs: 120,
      selfHostnames: ['mx-space.local'],
      extraNodes: ['node-a'] as any,
      editorStyle: { minHeight: 120 },
      imageUpload: (() => Promise.resolve('ok')) as any,
    })

    expect(result).toMatchObject({
      theme: 'dark',
      placeholder: 'Write here',
      variant: 'article',
      autoFocus: true,
      className: 'editor-shell',
      contentClassName: 'editor-content',
      debounceMs: 120,
      selfHostnames: ['mx-space.local'],
      extraNodes: ['node-a'],
      style: { minHeight: 120 },
      imageUpload: expect.any(Function),
    })
    expect(result).not.toHaveProperty('editorStyle')
  })

  it('omits undefined values', () => {
    const result = buildShiroEditorProps('light', {
      placeholder: undefined,
      editorStyle: undefined,
      className: 'editor-shell',
    })

    expect(result).toEqual({
      theme: 'light',
      className: 'editor-shell',
    })
  })
})
