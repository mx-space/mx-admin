import {
  Bold,
  Code,
  FileCode,
  Heading,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  Smile,
  Strikethrough,
  Undo2,
} from 'lucide-vue-next'
import { NPopover } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import type { EditorView } from '@codemirror/view'
import type { Component, PropType } from 'vue'

import { redo, undo } from '@codemirror/commands'

import { EmojiPicker } from './emoji-picker'
import { commands } from './markdown-commands'

interface ToolbarButton {
  icon: Component
  title: string
  shortcut: string
  action: () => void
  divider?: boolean
}

export const MarkdownToolbar = defineComponent({
  name: 'MarkdownToolbar',
  props: {
    editorView: {
      type: Object as PropType<EditorView | undefined>,
      required: true,
    },
  },
  setup(props) {
    const emojiPickerVisible = ref(false)
    const emojiButtonRef = ref<HTMLElement>()

    const executeCommand = (commandFn: (view: EditorView) => boolean) => {
      if (props.editorView) {
        commandFn(props.editorView)
      }
    }

    const handleEmojiSelect = (emoji: string) => {
      if (props.editorView) {
        commands.emoji(props.editorView, emoji)
      }
      emojiPickerVisible.value = false
    }

    const buttons: ToolbarButton[] = [
      {
        icon: Smile,
        title: '插入表情',
        shortcut: 'Ctrl+E',
        action: () => {
          emojiPickerVisible.value = !emojiPickerVisible.value
        },
      },
      {
        icon: Heading,
        title: '标题',
        shortcut: 'Ctrl+H',
        action: () => executeCommand(commands.heading),
      },
      {
        icon: Bold,
        title: '粗体',
        shortcut: 'Ctrl+B',
        action: () => executeCommand(commands.bold),
      },
      {
        icon: Italic,
        title: '斜体',
        shortcut: 'Ctrl+I',
        action: () => executeCommand(commands.italic),
      },
      {
        icon: Strikethrough,
        title: '删除线',
        shortcut: 'Ctrl+D',
        action: () => executeCommand(commands.strikethrough),
      },
      {
        icon: Link,
        title: '链接',
        shortcut: 'Ctrl+K',
        action: () => executeCommand(commands.link),
        divider: true,
      },
      {
        icon: List,
        title: '无序列表',
        shortcut: 'Ctrl+L',
        action: () => executeCommand(commands.bulletList),
      },
      {
        icon: ListOrdered,
        title: '有序列表',
        shortcut: 'Ctrl+O',
        action: () => executeCommand(commands.orderedList),
      },
      {
        icon: ListTodo,
        title: '任务列表',
        shortcut: 'Ctrl+J',
        action: () => executeCommand(commands.taskList),
        divider: true,
      },
      {
        icon: Quote,
        title: '引用',
        shortcut: 'Ctrl+;',
        action: () => executeCommand(commands.quote),
      },
      {
        icon: Minus,
        title: '分隔线',
        shortcut: 'Ctrl+Shift+H',
        action: () => executeCommand(commands.horizontalRule),
      },
      {
        icon: FileCode,
        title: '代码块',
        shortcut: 'Ctrl+U',
        action: () => executeCommand(commands.codeBlock),
      },
      {
        icon: Code,
        title: '行内代码',
        shortcut: 'Ctrl+G',
        action: () => executeCommand(commands.inlineCode),
        divider: true,
      },
      {
        icon: Undo2,
        title: '撤销',
        shortcut: 'Ctrl+Z',
        action: () => {
          if (props.editorView) {
            props.editorView.focus()
            undo(props.editorView)
          }
        },
      },
      {
        icon: Redo2,
        title: '重做',
        shortcut: 'Ctrl+Y',
        action: () => {
          if (props.editorView) {
            props.editorView.focus()
            redo(props.editorView)
          }
        },
      },
    ]

    const ToolbarButtonComponent = defineComponent({
      props: {
        button: {
          type: Object as PropType<ToolbarButton>,
          required: true,
        },
        isEmojiButton: {
          type: Boolean,
          default: false,
        },
      },
      setup(buttonProps) {
        return () => (
          <NPopover
            trigger="hover"
            placement="bottom"
            delay={400}
            showArrow={false}
          >
            {{
              trigger: () => (
                <button
                  ref={buttonProps.isEmojiButton ? emojiButtonRef : undefined}
                  onClick={buttonProps.button.action}
                  class="toolbar-button inline-flex cursor-pointer items-center justify-center border-none bg-transparent outline-none"
                  aria-label={buttonProps.button.title}
                >
                  {/* @ts-ignore */}
                  <buttonProps.button.icon size={15} />
                </button>
              ),
              default: () => (
                <div class="px-2 py-1.5">
                  <div class="whitespace-nowrap text-xs">
                    {buttonProps.button.title}
                    <span class="ml-2 opacity-50">
                      {buttonProps.button.shortcut}
                    </span>
                  </div>
                </div>
              ),
            }}
          </NPopover>
        )
      },
    })

    return () => (
      <div class="markdown-toolbar flex items-center gap-2 py-2 pl-2 pr-4">
        {buttons.flatMap((button, index) => {
          const elements = [
            <ToolbarButtonComponent
              key={`btn-${index}`}
              button={button}
              isEmojiButton={index === 0}
            />,
          ]

          if (button.divider) {
            elements.push(
              <span
                key={`div-${index}`}
                class="inline-block h-4 w-px bg-gray-300 opacity-50 dark:bg-gray-600"
              />,
            )
          }

          return elements
        })}

        <NPopover
          show={emojiPickerVisible.value}
          onUpdateShow={(val) => (emojiPickerVisible.value = val)}
          trigger="manual"
          placement="bottom-start"
          x-placement="bottom-start"
          to={emojiButtonRef.value}
          style={{ padding: 0 }}
          onClickoutside={() => (emojiPickerVisible.value = false)}
        >
          {{
            trigger: () => (
              <span ref={emojiButtonRef} style={{ position: 'absolute' }} />
            ),
            default: () => <EmojiPicker onSelect={handleEmojiSelect} />,
          }}
        </NPopover>

        <style>
          {`
          .markdown-toolbar {
            background: transparent;
          }
          .markdown-toolbar .toolbar-button {
            padding: 6px;
            border-radius: 6px;
            transition: all 0.2s ease;
            opacity: 0.6;
          }
          .markdown-toolbar .toolbar-button:hover {
            opacity: 1;
            background-color: rgba(0, 0, 0, 0.04);
          }
          .dark .markdown-toolbar .toolbar-button:hover {
            background-color: rgba(255, 255, 255, 0.08);
          }
          .markdown-toolbar .toolbar-button:active {
            transform: scale(0.95);
          }
          `}
        </style>
      </div>
    )
  },
})
