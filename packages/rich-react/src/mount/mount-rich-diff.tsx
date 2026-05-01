import { createRoot } from 'react-dom/client'
import type { SerializedEditorState } from 'lexical'

import { RichDiff } from '@haklex/rich-diff'
import { nestedDocNodes } from '@haklex/rich-ext-nested-doc/static'
import {
  codeSnippetNodes,
  embedNodes,
  enhancedRendererConfig,
  ExcalidrawNode,
  galleryNodes,
} from '@haklex/rich-kit-shiro'

import '@haklex/rich-diff/style.css'

const extraNodes = [
  ExcalidrawNode,
  ...embedNodes,
  ...galleryNodes,
  ...codeSnippetNodes,
  ...nestedDocNodes,
]

export interface MountRichDiffOptions {
  oldValue: SerializedEditorState
  newValue: SerializedEditorState
  variant?: 'article' | 'comment' | 'note'
  className?: string
  theme: 'dark' | 'light'
}

export interface RichDiffHandle {
  update(opts: MountRichDiffOptions): void
  unmount(): void
}

export function mountRichDiff(
  container: HTMLElement,
  initial: MountRichDiffOptions,
): RichDiffHandle {
  const root = createRoot(container)

  const render = (opts: MountRichDiffOptions) => {
    root.render(
      <RichDiff
        oldValue={opts.oldValue}
        newValue={opts.newValue}
        variant={opts.variant}
        theme={opts.theme}
        className={opts.className}
        extraNodes={extraNodes}
        rendererConfig={enhancedRendererConfig}
      />,
    )
  }

  render(initial)

  return {
    update(opts) {
      render(opts)
    },
    unmount() {
      root.unmount()
    },
  }
}
