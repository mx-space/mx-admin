/* eslint-disable vue/no-setup-props-destructure */
import { defineComponent } from 'vue'
import type { EditorState } from '@codemirror/state'
import type { PropType } from 'vue'

import { useSaveConfirm } from '~/hooks/use-save-confirm'

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
import { useCodeMirror } from './use-codemirror'
import { blockquoteWysiwygExtension } from './wysiwyg-blockquote'
import { codeBlockWysiwygExtension } from './wysiwyg-codeblock'
import { dividerWysiwygExtension } from './wysiwyg-divider'
import { emptyLineWysiwygExtension } from './wysiwyg-empty-line'
import { headingWysiwygExtension } from './wysiwyg-heading'
import { inlineWysiwygExtension } from './wysiwyg-inline'
import { listWysiwygExtension } from './wysiwyg-list'
import { mathWysiwygExtension } from './wysiwyg-math'

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
              ...inlineWysiwygExtension,
              ...codeBlockWysiwygExtension,
              ...listWysiwygExtension,
              ...blockquoteWysiwygExtension,
              ...mathWysiwygExtension,
              ...emptyLineWysiwygExtension,
            ]
          : []

        view.dispatch({
          effects: [
            codemirrorReconfigureExtensionMap.wysiwyg.reconfigure(extensions),
            codemirrorReconfigureExtensionMap.wysiwygMode.reconfigure(
              isWysiwyg ? [wysiwygModeExtension] : [],
            ),
          ],
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
      () => memoedText === editorView.value?.state.doc.toString(),
    )

    // 浮动工具栏选区位置追踪
    const { position, hasSelection } = useSelectionPosition(editorView)

    // 点击空白区域聚焦编辑器并将光标移到末尾 (WYSIWYG 模式)
    const handleContainerPointerDown = (e: PointerEvent) => {
      const view = editorView.value
      if (!view) return

      const isWysiwyg = (props.renderMode ?? 'plain') === 'wysiwyg'
      if (!isWysiwyg) return

      // 检查点击目标是否在 cm-content 内部
      const target = e.target as HTMLElement
      if (target.closest('.cm-content')) return

      // 点击的是空白区域，聚焦编辑器并将光标移到文档末尾
      e.preventDefault()
      view.focus()
      view.dispatch({
        selection: { anchor: view.state.doc.length },
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
      </div>
    )
  },
})
