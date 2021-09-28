import { React } from '@vicons/fa'
import { NSpin } from 'naive-ui'
import { PlainEditor } from '../plain/plain'
import { Editor } from './constants'

const cache: Record<Editor, any> = {
  [Editor.monaco]: null,
  [Editor.vditor]: null,
  [Editor.plain]: null,
}

export const getDynamicEditor = (editor: Editor) => {
  if (cache[editor]) {
    return cache[editor]
  }
  switch (editor) {
    case 'monaco': {
      const MonacoEditor = defineAsyncComponent({
        loader: () => import('../monaco/monaco').then((m) => m.MonacoEditor),
        loadingComponent: <NSpin strokeWidth={14} show rotate />,
        suspensible: true,
      })
      cache[editor] = MonacoEditor
      return MonacoEditor
    }
    case 'vditor': {
      const VditorEditor = defineAsyncComponent({
        loader: () => import('../vditor/vditor').then((m) => m.VditorEditor),
        loadingComponent: <NSpin strokeWidth={14} show rotate />,
        suspensible: true,
      })

      cache[editor] = VditorEditor
      return VditorEditor
    }
    case 'plain':
      cache[editor] = PlainEditor
      return PlainEditor
    default:
      return null
  }
}
