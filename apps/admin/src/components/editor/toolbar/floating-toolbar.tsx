import { Bold, Code, Italic, Link, Strikethrough } from 'lucide-vue-next'
import {
  defineComponent,
  onUnmounted,
  ref,
  Teleport,
  Transition,
  watch,
} from 'vue'
import type { EditorView } from '@codemirror/view'
import type { Component, PropType } from 'vue'
import type { SelectionPosition } from './use-selection-position'

import { commands, isInlineFormatActive } from './markdown-commands'

import './floating-toolbar.css'

interface ToolbarButton {
  icon: Component
  title: string
  shortcut: string
  action: (view: EditorView) => void
  isActive?: (view: EditorView) => boolean
}

interface ToolbarGroup {
  id: string
  buttons: ToolbarButton[]
}

export const FloatingToolbar = defineComponent({
  name: 'FloatingToolbar',
  props: {
    editorView: {
      type: Object as PropType<EditorView | undefined>,
      required: true,
    },
    visible: {
      type: Boolean,
      required: true,
    },
    position: {
      type: Object as PropType<SelectionPosition | null>,
      default: null,
    },
  },
  setup(props) {
    const selectionVersion = ref(0)
    let detachSelectionListeners: (() => void) | null = null

    const groups: ToolbarGroup[] = [
      {
        id: 'format',
        buttons: [
          {
            icon: Bold,
            title: '粗体',
            shortcut: '⌘B',
            action: commands.bold,
            isActive: (view) => isInlineFormatActive(view, 'bold'),
          },
          {
            icon: Italic,
            title: '斜体',
            shortcut: '⌘I',
            action: commands.italic,
            isActive: (view) => isInlineFormatActive(view, 'italic'),
          },
          {
            icon: Strikethrough,
            title: '删除线',
            shortcut: '⌘D',
            action: commands.strikethrough,
            isActive: (view) => isInlineFormatActive(view, 'strikethrough'),
          },
        ],
      },
      {
        id: 'insert',
        buttons: [
          {
            icon: Link,
            title: '链接',
            shortcut: '⌘K',
            action: commands.link,
          },
          {
            icon: Code,
            title: '代码',
            shortcut: '⌘E',
            action: commands.inlineCode,
            isActive: (view) => isInlineFormatActive(view, 'inlineCode'),
          },
        ],
      },
    ]

    const executeCommand = (action: (view: EditorView) => void) => {
      if (props.editorView) {
        action(props.editorView)
        props.editorView.focus()
        selectionVersion.value += 1
      }
    }

    const updateSelectionState = () => {
      selectionVersion.value += 1
    }

    const setupSelectionListeners = (view: EditorView | undefined) => {
      if (!view) return

      const handleMouseUp = () => updateSelectionState()
      const handleKeyUp = (e: KeyboardEvent) => {
        if (
          e.key === 'Shift' ||
          e.key.startsWith('Arrow') ||
          e.ctrlKey ||
          e.metaKey
        ) {
          updateSelectionState()
        }
      }
      const handleMouseDown = () => updateSelectionState()

      view.dom.addEventListener('mouseup', handleMouseUp)
      view.dom.addEventListener('keyup', handleKeyUp)
      view.dom.addEventListener('mousedown', handleMouseDown)

      detachSelectionListeners = () => {
        view.dom.removeEventListener('mouseup', handleMouseUp)
        view.dom.removeEventListener('keyup', handleKeyUp)
        view.dom.removeEventListener('mousedown', handleMouseDown)
      }
    }

    watch(
      () => props.editorView,
      (view) => {
        if (detachSelectionListeners) {
          detachSelectionListeners()
          detachSelectionListeners = null
        }
        setupSelectionListeners(view)
        updateSelectionState()
      },
      { immediate: true },
    )

    onUnmounted(() => {
      if (detachSelectionListeners) {
        detachSelectionListeners()
      }
    })

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="floating-toolbar-enter-active"
          leaveActiveClass="floating-toolbar-leave-active"
          enterFromClass="floating-toolbar-enter-from"
          leaveToClass="floating-toolbar-leave-to"
        >
          {props.visible && props.position && (
            <div
              class={[
                'floating-toolbar',
                'fixed z-50',
                'flex items-center',
                'rounded-xl',
                'bg-white/95 dark:bg-neutral-900/95',
                'backdrop-blur-xl backdrop-saturate-150',
                'border border-neutral-200/60 dark:border-neutral-700/60',
                'shadow-xl shadow-neutral-900/10 dark:shadow-neutral-950/50',
                'p-1',
              ]}
              style={{
                left: `${props.position.x}px`,
                top: props.position.above
                  ? `${props.position.y - 52}px`
                  : `${props.position.y + 8}px`,
                transform: 'translateX(-50%)',
              }}
              onMousedown={(e) => e.preventDefault()}
            >
              {groups.map((group, groupIndex) => (
                <div key={group.id} class="flex items-center">
                  {groupIndex > 0 && (
                    <div class="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
                  )}
                  <div class="flex items-center gap-0.5">
                    {group.buttons.map((button) => (
                      <button
                        key={button.title}
                        onClick={() => executeCommand(button.action)}
                        class={[
                          'group relative flex items-center justify-center',
                          'size-8 rounded-lg',
                          'text-neutral-500 dark:text-neutral-400',
                          'transition-all duration-150',
                          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          'hover:text-neutral-900 dark:hover:text-neutral-100',
                          selectionVersion.value && props.editorView
                            ? button.isActive?.(props.editorView)
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200'
                              : ''
                            : '',
                          'active:scale-95',
                        ]}
                        aria-label={button.title}
                      >
                        {/* @ts-ignore */}
                        <button.icon size={16} strokeWidth={2} />

                        {/* Tooltip */}
                        <div
                          class={[
                            'absolute bottom-full left-1/2 mb-2 -translate-x-1/2',
                            'rounded-lg px-2 py-1.5',
                            'bg-neutral-900 dark:bg-neutral-100',
                            'text-white dark:text-neutral-900',
                            'whitespace-nowrap text-xs font-medium',
                            'pointer-events-none scale-95 opacity-0',
                            'transition-all duration-150',
                            'group-hover:scale-100 group-hover:opacity-100',
                            'shadow-lg',
                          ]}
                        >
                          <div class="flex items-center gap-2">
                            <span>{button.title}</span>
                            <kbd
                              class={[
                                'rounded px-1 py-0.5',
                                'bg-neutral-700 dark:bg-neutral-300',
                                'text-neutral-300 dark:text-neutral-600',
                                'font-mono text-xs',
                              ]}
                            >
                              {button.shortcut}
                            </kbd>
                          </div>
                          {/* Arrow */}
                          <div
                            class={[
                              'absolute left-1/2 top-full -translate-x-1/2',
                              'border-4 border-transparent',
                              'border-t-neutral-900 dark:border-t-neutral-100',
                            ]}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Transition>
      </Teleport>
    )
  },
})
