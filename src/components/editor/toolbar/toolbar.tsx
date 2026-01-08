import { NButton, NButtonGroup, NDivider, NPopover } from 'naive-ui'
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
          <NPopover trigger="hover" placement="bottom" delay={500}>
            {{
              trigger: () => (
                <NButton
                  text
                  size="small"
                  onClick={buttonProps.button.action}
                  class="toolbar-button"
                >
                  <Icon size={16}>
                    <buttonProps.button.icon />
                  </Icon>
                </NButton>
              ),
              default: () => (
                <div class="flex flex-col gap-1 text-xs">
                  <div class="font-medium">{buttonProps.button.title}</div>
                  <div class="text-gray-400">{buttonProps.button.shortcut}</div>
                </div>
              ),
            }}
          </NPopover>
        )
      },
    })

    return () => (
      <div class="markdown-toolbar flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <NButtonGroup size="small">
          {buttons.map((button, index) => [
            <ToolbarButtonComponent key={`btn-${index}`} button={button} />,
            button.divider && (
              <NDivider
                key={`div-${index}`}
                vertical
                class="!mx-1 !my-1 !h-4 !border-gray-300 dark:!border-gray-600"
              />
            ),
          ])}
        </NButtonGroup>

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
          .markdown-toolbar .toolbar-button {
            padding: 4px 8px;
            transition: all 0.2s;
          }
          .markdown-toolbar .toolbar-button:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
          .dark .markdown-toolbar .toolbar-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
          `}
        </style>
      </div>
    )
  },
})
