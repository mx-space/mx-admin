/* eslint-disable vue/no-setup-props-destructure */
import { defineComponent, watch } from 'vue'
import type { EditorState } from '@codemirror/state'
import type { PropType } from 'vue'

import { EditorView } from '@codemirror/view'

import { useSaveConfirm } from '~/hooks/use-save-confirm'

import { SlashMenu, slashMenuExtension } from '../slash-menu'
import { FloatingToolbar } from '../toolbar/floating-toolbar'
import { useSelectionPosition } from '../toolbar/use-selection-position'
import styles from '../universal/editor.module.css'
import { editorBaseProps } from '../universal/props'

import 'katex/dist/katex.min.css'
import './codemirror.css'

import {
  codemirrorReconfigureExtensionMap,
  wysiwygModeExtension,
} from './extension'
import { ImageEditPopover } from './ImageEditPopover'
import { useCodeMirror } from './use-codemirror'
import { blockquoteWysiwygExtension } from './wysiwyg-blockquote'
import { codeBlockWysiwygExtension } from './wysiwyg-codeblock'
import { dividerWysiwygExtension } from './wysiwyg-divider'
import { headingWysiwygExtension } from './wysiwyg-heading'
import { inlineWysiwygExtension } from './wysiwyg-inline'
import { listWysiwygExtension } from './wysiwyg-list'
import { mathWysiwygExtension } from './wysiwyg-math'
import { wysiwygMeasureExtension } from './wysiwyg-measure'

export const CodemirrorEditor = defineComponent({
  name: 'CodemirrorEditor',
  props: {
    ...editorBaseProps,
    onStateChange: {
      type: Function as PropType<(state: EditorState) => void>,
      required: false,
    },
    onArrowUpAtFirstLine: {
      type: Function as PropType<() => void>,
      required: false,
    },
    className: {
      type: String,
    },
  },
  setup(props, { expose }) {
    const [refContainer, editorView] = useCodeMirror({
      initialDoc: props.text,
      onChange: (state) => {
        props.onChange(state.doc.toString())
        props.onStateChange?.(state)
      },
      onArrowUpAtFirstLine: props.onArrowUpAtFirstLine,
    })

    watch(
      () => props.text,
      (n) => {
        const editor = editorView.value

        if (editor && n != editor.state.doc.toString()) {
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: n },
          })
        }
      },
    )

    watch(
      () => [props.renderMode, editorView.value],
      ([renderMode]) => {
        const view = editorView.value
        if (!view) return

        const hadFocus = view.hasFocus
        const isWysiwyg = (renderMode ?? 'plain') === 'wysiwyg'
        const extensions = isWysiwyg
          ? [
              ...dividerWysiwygExtension,
              ...headingWysiwygExtension,
              ...listWysiwygExtension,
              ...blockquoteWysiwygExtension,
              ...mathWysiwygExtension,
              ...inlineWysiwygExtension,
              ...codeBlockWysiwygExtension,
              // ...emptyLineWysiwygExtension,
              wysiwygMeasureExtension,
            ]
          : []

        const selectionHead = view.state.selection.main.head

        view.dispatch({
          effects: [
            codemirrorReconfigureExtensionMap.wysiwyg.reconfigure(extensions),
            codemirrorReconfigureExtensionMap.wysiwygMode.reconfigure(
              isWysiwyg ? [wysiwygModeExtension] : [],
            ),
            codemirrorReconfigureExtensionMap.slashMenu.reconfigure(
              isWysiwyg ? slashMenuExtension : [],
            ),
          ],
        })
        view.requestMeasure()

        requestAnimationFrame(() => {
          view.dispatch({
            effects: EditorView.scrollIntoView(selectionHead, {
              y: 'center',
            }),
          })
        })

        if (hadFocus) {
          requestAnimationFrame(() => view.focus())
        }
      },
      {
        immediate: true,
        flush: 'post',
      },
    )

    expose({
      setValue: (value: string) => {
        const editor = editorView.value
        if (editor) {
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: value },
          })
        }
      },
      focus: () => {
        editorView.value?.focus()
      },
    })

    const memoedText = props.text

    useSaveConfirm(
      props.unSaveConfirm,
      () =>
        props.saveConfirmFn?.() ??
        memoedText === editorView.value?.state.doc.toString(),
    )

    // 浮动工具栏选区位置追踪
    const { position, hasSelection } = useSelectionPosition(editorView)

    // 点击空白区域聚焦编辑器并将光标移到对应位置 (WYSIWYG 模式)
    const handleContainerPointerDown = (e: PointerEvent) => {
      const view = editorView.value
      if (!view) return

      const isWysiwyg = (props.renderMode ?? 'plain') === 'wysiwyg'
      if (!isWysiwyg) return

      if (e.button !== 0) return

      const path = e.composedPath()
      if (path.includes(view.contentDOM)) return

      const target = e.target
      if (target instanceof Node && view.contentDOM.contains(target)) return

      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY })
      if (pos == null) return

      e.preventDefault()
      view.focus()
      view.dispatch({
        selection: { anchor: pos },
      })
    }

    return () => (
      <div
        class="relative flex h-full flex-col"
        onPointerdown={handleContainerPointerDown}
      >
        <div
          class={[styles.editor, props.className, 'flex-1 overflow-auto']}
          ref={refContainer}
        />
        {/* 浮动工具栏 */}
        <FloatingToolbar
          editorView={editorView.value}
          visible={hasSelection.value}
          position={position.value}
        />
        {(props.renderMode ?? 'plain') === 'wysiwyg' && (
          <SlashMenu editorView={editorView.value} />
        )}
        {/* 图片编辑 Popover 单例 */}
        <ImageEditPopover />
      </div>
    )
  },
})
