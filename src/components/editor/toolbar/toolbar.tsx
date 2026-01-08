import { NPopover } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import type { EditorView } from '@codemirror/view'
import type { PropType } from 'vue'

import Bold from '@vicons/fa/Bold'
import Code from '@vicons/fa/Code'
import FileCode from '@vicons/fa/FileCode'
import Heading from '@vicons/fa/Heading'
import Italic from '@vicons/fa/Italic'
import Link from '@vicons/fa/Link'
import ListOl from '@vicons/fa/ListOl'
import ListUl from '@vicons/fa/ListUl'
import Minus from '@vicons/fa/Minus'
import QuoteRight from '@vicons/fa/QuoteRight'
import RedoAlt from '@vicons/fa/RedoAlt'
import Smile from '@vicons/fa/Smile'
import Strikethrough from '@vicons/fa/Strikethrough'
import Tasks from '@vicons/fa/Tasks'
import UndoAlt from '@vicons/fa/UndoAlt'
import { Icon } from '@vicons/utils'

import { EmojiPicker } from './emoji-picker'
import { commands } from './markdown-commands'

interface ToolbarButton {
  icon: any
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
        icon: ListUl,
        title: '无序列表',
        shortcut: 'Ctrl+L',
        action: () => executeCommand(commands.bulletList),
      },
      {
        icon: ListOl,
        title: '有序列表',
        shortcut: 'Ctrl+O',
        action: () => executeCommand(commands.orderedList),
      },
      {
        icon: Tasks,
        title: '任务列表',
        shortcut: 'Ctrl+J',
        action: () => executeCommand(commands.taskList),
        divider: true,
      },
      {
        icon: QuoteRight,
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
        icon: UndoAlt,
        title: '撤销',
        shortcut: 'Ctrl+Z',
        action: () => {
          props.editorView?.focus()
        },
      },
      {
        icon: RedoAlt,
        title: '重做',
        shortcut: 'Ctrl+Y',
        action: () => {
          props.editorView?.focus()
        },
      },
    ]

    const ToolbarButtonComponent = defineComponent({
      props: {
        button: {
          type: Object as PropType<ToolbarButton>,
          required: true,
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
                  onClick={buttonProps.button.action}
                  class="toolbar-button inline-flex cursor-pointer items-center justify-center border-none bg-transparent outline-none"
                >
                  <Icon size={15}>
                    <buttonProps.button.icon />
                  </Icon>
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
        {buttons.map((button, index) => [
          <ToolbarButtonComponent key={`btn-${index}`} button={button} />,
          button.divider && (
            <span
              key={`div-${index}`}
              class="inline-block h-4 w-px bg-gray-300 opacity-50 dark:bg-gray-600"
            />
          ),
        ])}

        {/* 表情选择器 */}
        <NPopover
          show={emojiPickerVisible.value}
          onUpdateShow={(val) => (emojiPickerVisible.value = val)}
          trigger="manual"
          placement="bottom-start"
          style={{ padding: 0 }}
        >
          {{
            trigger: () => <span style={{ display: 'none' }} />,
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
