import {
  Bold,
  Code,
  Heading,
  Italic,
  Link,
  Strikethrough,
} from 'lucide-vue-next'
import { NTooltip } from 'naive-ui'
import { defineComponent, Teleport, Transition } from 'vue'
import type { EditorView } from '@codemirror/view'
import type { Component, PropType } from 'vue'
import type { SelectionPosition } from './use-selection-position'

import { commands } from './markdown-commands'

interface ToolbarButton {
  icon: Component
  title: string
  shortcut: string
  action: (view: EditorView) => void
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
    const buttons: ToolbarButton[] = [
      {
        icon: Heading,
        title: '标题',
        shortcut: 'Ctrl+H',
        action: commands.heading,
      },
      {
        icon: Bold,
        title: '粗体',
        shortcut: 'Ctrl+B',
        action: commands.bold,
      },
      {
        icon: Italic,
        title: '斜体',
        shortcut: 'Ctrl+I',
        action: commands.italic,
      },
      {
        icon: Strikethrough,
        title: '删除线',
        shortcut: 'Ctrl+D',
        action: commands.strikethrough,
      },
      {
        icon: Link,
        title: '链接',
        shortcut: 'Ctrl+K',
        action: commands.link,
      },
      {
        icon: Code,
        title: '行内代码',
        shortcut: 'Ctrl+G',
        action: commands.inlineCode,
      },
    ]

    const executeCommand = (action: (view: EditorView) => void) => {
      if (props.editorView) {
        action(props.editorView)
        // Keep focus on editor after action
        props.editorView.focus()
      }
    }

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="transition-all duration-150 ease-out"
          leaveActiveClass="transition-all duration-100 ease-in"
          enterFromClass="opacity-0 scale-95 translate-y-1"
          leaveToClass="opacity-0 scale-95 translate-y-1"
        >
          {props.visible && props.position && (
            <div
              class={[
                'fixed z-50',
                'flex items-center gap-0.5 px-1.5 py-1',
                'rounded-lg',
                // Glass morphism
                'bg-white/95 dark:bg-neutral-900/95',
                'backdrop-blur-xl backdrop-saturate-150',
                // Border
                'border border-neutral-200/60 dark:border-neutral-700/60',
                // Shadow
                'shadow-lg shadow-neutral-900/10 dark:shadow-neutral-900/50',
              ]}
              style={{
                left: `${props.position.x}px`,
                top: props.position.above
                  ? `${props.position.y - 48}px`
                  : `${props.position.y + 8}px`,
                transform: 'translateX(-50%)',
              }}
              onMousedown={(e) => e.preventDefault()}
            >
              {buttons.map((button, index) => (
                <NTooltip
                  key={index}
                  trigger="hover"
                  placement="top"
                  delay={300}
                  showArrow={false}
                >
                  {{
                    trigger: () => (
                      <button
                        onClick={() => executeCommand(button.action)}
                        class={[
                          'flex items-center justify-center',
                          'size-7 rounded-md',
                          'text-neutral-600 dark:text-neutral-400',
                          'transition-all duration-150',
                          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          'hover:text-neutral-900 dark:hover:text-neutral-100',
                          'active:scale-95',
                        ]}
                        aria-label={button.title}
                      >
                        {/* @ts-ignore */}
                        <button.icon size={15} strokeWidth={2} />
                      </button>
                    ),
                    default: () => (
                      <div class="flex items-center gap-2 text-xs">
                        <span>{button.title}</span>
                        <span class="text-neutral-400">{button.shortcut}</span>
                      </div>
                    ),
                  }}
                </NTooltip>
              ))}
            </div>
          )}
        </Transition>
      </Teleport>
    )
  },
})
