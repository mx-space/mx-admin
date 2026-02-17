import {
  AlertCircle,
  AlertTriangle,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Flag,
  Grid3x3,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Highlighter,
  Image,
  Images,
  Info,
  Italic,
  Lightbulb,
  Link,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  MessageSquare,
  Minus,
  Paintbrush,
  Plus,
  Quote,
  ShieldAlert,
  Sigma,
  Sparkles,
  Strikethrough,
  Table,
  User,
  Zap,
} from 'lucide-vue-next'
import { NButton, NInput, NSelect } from 'naive-ui'
import { h, ref } from 'vue'
import type { EditorView } from '@codemirror/view'
import type { Component } from 'vue'

import { commands, setHeadingLevel } from '../toolbar/markdown-commands'

export interface SlashMenuItem {
  id: string
  label: string
  description?: string
  icon?: Component
  keywords?: string[]
  command: (view: EditorView) => boolean
}

export interface SlashMenuGroup {
  id: string
  label: string
  items: SlashMenuItem[]
}

// 对话框辅助函数
const showInputDialog = (
  title: string,
  placeholder: string,
  defaultValue = '',
  onConfirm: (value: string) => void,
) => {
  const inputValue = ref(defaultValue)
  const $dialog = window.dialog.create({
    title,
    content: () =>
      h(NInput, {
        value: inputValue.value,
        placeholder,
        autofocus: true,
        onUpdateValue: (v: string) => {
          inputValue.value = v
        },
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            $dialog.destroy()
            onConfirm(inputValue.value)
          }
        },
      }),
    action: () =>
      h('div', { class: 'flex gap-2 justify-end' }, [
        h(
          NButton,
          {
            onClick: () => $dialog.destroy(),
          },
          { default: () => '取消' },
        ),
        h(
          NButton,
          {
            type: 'primary',
            onClick: () => {
              $dialog.destroy()
              onConfirm(inputValue.value)
            },
          },
          { default: () => '确定' },
        ),
      ]),
  })
}

const showTextareaDialog = (
  title: string,
  placeholder: string,
  defaultValue = '',
  onConfirm: (value: string) => void,
) => {
  const inputValue = ref(defaultValue)
  const $dialog = window.dialog.create({
    title,
    content: () =>
      h(NInput, {
        value: inputValue.value,
        placeholder,
        type: 'textarea',
        rows: 4,
        autofocus: true,
        onUpdateValue: (v: string) => {
          inputValue.value = v
        },
      }),
    action: () =>
      h('div', { class: 'flex gap-2 justify-end' }, [
        h(
          NButton,
          {
            onClick: () => $dialog.destroy(),
          },
          { default: () => '取消' },
        ),
        h(
          NButton,
          {
            type: 'primary',
            onClick: () => {
              $dialog.destroy()
              onConfirm(inputValue.value)
            },
          },
          { default: () => '确定' },
        ),
      ]),
  })
}

const showSelectDialog = (
  title: string,
  options: { label: string; value: string }[],
  defaultValue: string,
  onConfirm: (value: string) => void,
) => {
  const selectedValue = ref(defaultValue)
  const $dialog = window.dialog.create({
    title,
    content: () =>
      h(NSelect, {
        value: selectedValue.value,
        options,
        onUpdateValue: (v: string) => {
          selectedValue.value = v
        },
      }),
    action: () =>
      h('div', { class: 'flex gap-2 justify-end' }, [
        h(
          NButton,
          {
            onClick: () => $dialog.destroy(),
          },
          { default: () => '取消' },
        ),
        h(
          NButton,
          {
            type: 'primary',
            onClick: () => {
              $dialog.destroy()
              onConfirm(selectedValue.value)
            },
          },
          { default: () => '确定' },
        ),
      ]),
  })
}

const insertImage = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  showInputDialog('插入图片', '输入图片地址 (https://...)', '', (url) => {
    if (!url) return

    const alt = selectedText || '图片描述'
    const insert = `![${alt}](${url})`

    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length },
    })

    view.focus()
  })

  return true
}

const insertTable = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = `${needsNewline ? '\n' : ''}| 列1 | 列2 |\n| --- | --- |\n| 内容1 | 内容2 |\n`
  const cursorOffset = insert.indexOf('列1')

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: { anchor: insertPos + cursorOffset },
  })

  view.focus()
  return true
}

const insertDetails = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = `${needsNewline ? '\n' : ''}<details>\n<summary>摘要</summary>\n\n内容\n\n</details>\n`
  const summaryOffset = insert.indexOf('摘要')

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: {
      anchor: insertPos + summaryOffset,
      head: insertPos + summaryOffset + 2,
    },
  })

  view.focus()
  return true
}

const insertMathBlock = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = `${needsNewline ? '\n' : ''}$$\nE = mc^2\n$$\n`
  const cursorOffset = insert.indexOf('E = mc^2')

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: { anchor: insertPos + cursorOffset },
  })

  view.focus()
  return true
}

// Shiroi 扩展语法
const insertAlert =
  (type: 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION') =>
  (view: EditorView): boolean => {
    const { state } = view
    const { from } = state.selection.main
    const line = state.doc.lineAt(from)
    const insertPos = line.to
    const needsNewline = line.text.length > 0
    const insert = `${needsNewline ? '\n' : ''}> [!${type}]\n> 在此输入内容\n\n`
    const cursorOffset = insert.indexOf('在此输入内容')

    view.dispatch({
      changes: { from: insertPos, to: insertPos, insert },
      selection: { anchor: insertPos + cursorOffset },
    })

    view.focus()
    return true
  }

const insertSpoiler = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  if (selectedText) {
    // 如果有选中文本，直接包裹
    const insert = `||${selectedText}||`
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length },
    })
    view.focus()
  } else {
    // 否则显示输入对话框
    showInputDialog('插入剧透文本', '输入需要隐藏的内容', '', (content) => {
      if (!content.trim()) return

      const insert = `||${content}||`

      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length },
      })

      view.focus()
    })
  }

  return true
}

const insertMention =
  (platform: 'GH' | 'TW' | 'TG') =>
  (view: EditorView): boolean => {
    const { state } = view
    const { from, to } = state.selection.main
    const selectedText = state.sliceDoc(from, to)

    const platformNames = {
      GH: 'GitHub',
      TW: 'Twitter',
      TG: 'Telegram',
    }

    showInputDialog(
      `插入 ${platformNames[platform]} 提及`,
      '输入用户名',
      selectedText || '',
      (handle) => {
        if (!handle.trim()) return

        const insert = `{${platform}@${handle.trim()}}`

        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + insert.length },
        })

        view.focus()
      },
    )

    return true
  }

const insertContainer =
  (defaultType: string, placeholder = '在此输入内容') =>
  (view: EditorView): boolean => {
    const { state } = view
    const { from } = state.selection.main
    const line = state.doc.lineAt(from)
    const insertPos = line.to
    const needsNewline = line.text.length > 0

    // 如果是 banner 类型，让用户选择样式
    if (defaultType.startsWith('banner')) {
      showSelectDialog(
        '选择 Banner 样式',
        [
          { label: 'Error (错误)', value: 'banner {error}' },
          { label: 'Warning (警告)', value: 'banner {warning}' },
          { label: 'Info (信息)', value: 'banner {info}' },
          { label: 'Success (成功)', value: 'banner {success}' },
        ],
        'banner {error}',
        (type) => {
          const insert = `${needsNewline ? '\n' : ''}::: ${type}\n${placeholder}\n:::\n\n`
          const cursorOffset = insert.indexOf(placeholder)

          view.dispatch({
            changes: { from: insertPos, to: insertPos, insert },
            selection: { anchor: insertPos + cursorOffset },
          })

          view.focus()
        },
      )
    } else {
      const insert = `${needsNewline ? '\n' : ''}::: ${defaultType}\n${placeholder}\n:::\n\n`
      const cursorOffset = insert.indexOf(placeholder)

      view.dispatch({
        changes: { from: insertPos, to: insertPos, insert },
        selection: { anchor: insertPos + cursorOffset },
      })

      view.focus()
    }

    return true
  }

const insertGallery = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0

  showTextareaDialog(
    '插入画廊',
    '输入图片地址（每行一个）',
    'https://example.com/image1.jpg\nhttps://example.com/image2.jpg',
    (urls) => {
      if (!urls.trim()) return

      const insert = `${needsNewline ? '\n' : ''}::: gallery\n${urls.trim()}\n:::\n\n`

      view.dispatch({
        changes: { from: insertPos, to: insertPos, insert },
        selection: { anchor: insertPos + insert.length },
      })

      view.focus()
    },
  )

  return true
}

const insertGrid = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0

  showInputDialog(
    '插入网格布局',
    '输入配置 (如: cols=3,gap=4)',
    'cols=3,gap=4',
    (config) => {
      const finalConfig = config.trim() || 'cols=3,gap=4'
      const insert = `${needsNewline ? '\n' : ''}::: grid {${finalConfig}}\n内容1\n\n内容2\n\n内容3\n:::\n\n`
      const cursorOffset = insert.indexOf('内容1')

      view.dispatch({
        changes: { from: insertPos, to: insertPos, insert },
        selection: { anchor: insertPos + cursorOffset },
      })

      view.focus()
    },
  )

  return true
}

const insertLinkCard = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0

  showInputDialog(
    '插入链接卡片',
    '输入 GitHub 仓库 (如: username/repo)',
    '',
    (repo) => {
      if (!repo.trim()) return

      const insert = `${needsNewline ? '\n' : ''}<LinkCard source="gh" id="${repo.trim()}">\n\n`

      view.dispatch({
        changes: { from: insertPos, to: insertPos, insert },
        selection: { anchor: insertPos + insert.length },
      })

      view.focus()
    },
  )

  return true
}

const insertExcalidraw = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = `${needsNewline ? '\n' : ''}\`\`\`excalidraw\n{}\n\`\`\`\n\n`
  const cursorOffset = insert.indexOf('{}') + 1

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: { anchor: insertPos + cursorOffset },
  })

  view.focus()
  return true
}

const insertReactComponent = (view: EditorView): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const insertPos = line.to
  const needsNewline = line.text.length > 0

  showTextareaDialog(
    '插入 React 组件',
    '输入组件配置（import 和 name）',
    'import=https://cdn.example.com/component.js\nname=Component.Name',
    (config) => {
      if (!config.trim()) return

      const insert = `${needsNewline ? '\n' : ''}\`\`\`component\n${config.trim()}\n\`\`\`\n\n`

      view.dispatch({
        changes: { from: insertPos, to: insertPos, insert },
        selection: { anchor: insertPos + insert.length },
      })

      view.focus()
    },
  )

  return true
}

const insertMark = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)
  const content = selectedText || '高亮文本'
  const insert = `==${content}==`

  view.dispatch({
    changes: { from, to, insert },
    selection:
      selectedText.length > 0
        ? { anchor: from + insert.length }
        : { anchor: from + 2, head: from + 2 + content.length },
  })

  view.focus()
  return true
}

const insertInsertMark = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)
  const content = selectedText || '插入文本'
  const insert = `++${content}++`

  view.dispatch({
    changes: { from, to, insert },
    selection:
      selectedText.length > 0
        ? { anchor: from + insert.length }
        : { anchor: from + 2, head: from + 2 + content.length },
  })

  view.focus()
  return true
}

const insertFootnote = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main

  showInputDialog(
    '插入脚注',
    '输入脚注标识符 (如: 1, note1)',
    '1',
    (identifier) => {
      if (!identifier.trim()) return

      const insert = `[^${identifier.trim()}]`

      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length },
      })

      view.focus()
    },
  )

  return true
}

export const slashMenuGroups: SlashMenuGroup[] = [
  {
    id: 'heading',
    label: '标题',
    items: [
      {
        id: 'heading-1',
        label: '标题 1',
        description: '大标题',
        icon: Heading1,
        keywords: ['h1', '一级标题'],
        command: (view) => setHeadingLevel(view, 1),
      },
      {
        id: 'heading-2',
        label: '标题 2',
        description: '中标题',
        icon: Heading2,
        keywords: ['h2', '二级标题'],
        command: (view) => setHeadingLevel(view, 2),
      },
      {
        id: 'heading-3',
        label: '标题 3',
        description: '小标题',
        icon: Heading3,
        keywords: ['h3', '三级标题'],
        command: (view) => setHeadingLevel(view, 3),
      },
      {
        id: 'heading-4',
        label: '标题 4',
        description: '四级标题',
        icon: Heading4,
        keywords: ['h4', '四级标题'],
        command: (view) => setHeadingLevel(view, 4),
      },
      {
        id: 'heading-5',
        label: '标题 5',
        description: '五级标题',
        icon: Heading5,
        keywords: ['h5', '五级标题'],
        command: (view) => setHeadingLevel(view, 5),
      },
      {
        id: 'heading-6',
        label: '标题 6',
        description: '六级标题',
        icon: Heading6,
        keywords: ['h6', '六级标题'],
        command: (view) => setHeadingLevel(view, 6),
      },
    ],
  },
  {
    id: 'text',
    label: '文本格式',
    items: [
      {
        id: 'bold',
        label: '粗体',
        description: '加粗文字',
        icon: Bold,
        keywords: ['bold', 'strong'],
        command: commands.bold,
      },
      {
        id: 'italic',
        label: '斜体',
        description: '倾斜文字',
        icon: Italic,
        keywords: ['italic', 'em'],
        command: commands.italic,
      },
      {
        id: 'strikethrough',
        label: '删除线',
        description: '划掉文字',
        icon: Strikethrough,
        keywords: ['delete', 'strike'],
        command: commands.strikethrough,
      },
      {
        id: 'inline-code',
        label: '行内代码',
        description: '内联代码片段',
        icon: Code,
        keywords: ['code', 'inline'],
        command: commands.inlineCode,
      },
    ],
  },
  {
    id: 'list',
    label: '列表',
    items: [
      {
        id: 'bullet-list',
        label: '无序列表',
        description: '项目符号列表',
        icon: List,
        keywords: ['ul', 'bullet'],
        command: commands.bulletList,
      },
      {
        id: 'ordered-list',
        label: '有序列表',
        description: '编号列表',
        icon: ListOrdered,
        keywords: ['ol', 'number'],
        command: commands.orderedList,
      },
      {
        id: 'task-list',
        label: '任务列表',
        description: '待办事项',
        icon: ListChecks,
        keywords: ['todo', 'task'],
        command: commands.taskList,
      },
    ],
  },
  {
    id: 'block',
    label: '块元素',
    items: [
      {
        id: 'code-block',
        label: '代码块',
        description: '多行代码',
        icon: Code2,
        keywords: ['code', 'block'],
        command: commands.codeBlock,
      },
      {
        id: 'quote',
        label: '引用',
        description: '引用文本',
        icon: Quote,
        keywords: ['blockquote', 'quote'],
        command: commands.quote,
      },
      {
        id: 'divider',
        label: '分隔线',
        description: '水平分隔',
        icon: Minus,
        keywords: ['hr', 'divider'],
        command: commands.horizontalRule,
      },
      {
        id: 'details',
        label: '折叠块',
        description: '可折叠的内容区域',
        icon: ChevronDown,
        keywords: ['details', 'summary', 'collapse', 'toggle', '折叠'],
        command: insertDetails,
      },
    ],
  },
  {
    id: 'media',
    label: '媒体与嵌入',
    items: [
      {
        id: 'link',
        label: '链接',
        description: '添加超链接',
        icon: Link,
        keywords: ['link', 'url'],
        command: commands.link,
      },
      {
        id: 'image',
        label: '图片',
        description: '插入图片',
        icon: Image,
        keywords: ['image', 'img'],
        command: insertImage,
      },
      {
        id: 'table',
        label: '表格',
        description: '插入表格',
        icon: Table,
        keywords: ['table', 'grid'],
        command: insertTable,
      },
      {
        id: 'math',
        label: '数学公式',
        description: 'LaTeX 公式',
        icon: Sigma,
        keywords: ['math', 'formula', 'latex'],
        command: insertMathBlock,
      },
    ],
  },
  {
    id: 'shiroi-alerts',
    label: 'Shiroi 提示块',
    items: [
      {
        id: 'alert-note',
        label: 'Note 提示',
        description: '>[!NOTE] 提示信息',
        icon: Info,
        keywords: ['note', 'info', 'alert', '提示'],
        command: insertAlert('NOTE'),
      },
      {
        id: 'alert-tip',
        label: 'Tip 建议',
        description: '>[!TIP] 有用的建议',
        icon: Lightbulb,
        keywords: ['tip', 'hint', 'alert', '建议', '提示'],
        command: insertAlert('TIP'),
      },
      {
        id: 'alert-important',
        label: 'Important 重要',
        description: '>[!IMPORTANT] 重要信息',
        icon: AlertCircle,
        keywords: ['important', 'alert', '重要'],
        command: insertAlert('IMPORTANT'),
      },
      {
        id: 'alert-warning',
        label: 'Warning 警告',
        description: '>[!WARNING] 警告信息',
        icon: AlertTriangle,
        keywords: ['warning', 'alert', '警告'],
        command: insertAlert('WARNING'),
      },
      {
        id: 'alert-caution',
        label: 'Caution 注意',
        description: '>[!CAUTION] 需要注意',
        icon: ShieldAlert,
        keywords: ['caution', 'danger', 'alert', '注意', '危险'],
        command: insertAlert('CAUTION'),
      },
    ],
  },
  {
    id: 'shiroi-inline',
    label: 'Shiroi 行内语法',
    items: [
      {
        id: 'spoiler',
        label: '剧透文本',
        description: '||隐藏的内容||',
        icon: MessageSquare,
        keywords: ['spoiler', 'hidden', '剧透', '隐藏'],
        command: insertSpoiler,
      },
      {
        id: 'mention-github',
        label: 'GitHub 提及',
        description: '{GH@username}',
        icon: User,
        keywords: ['mention', 'github', 'gh', '@', '提及'],
        command: insertMention('GH'),
      },
      {
        id: 'mention-twitter',
        label: 'Twitter 提及',
        description: '{TW@username}',
        icon: User,
        keywords: ['mention', 'twitter', 'tw', '@', '提及'],
        command: insertMention('TW'),
      },
      {
        id: 'mention-telegram',
        label: 'Telegram 提及',
        description: '{TG@username}',
        icon: User,
        keywords: ['mention', 'telegram', 'tg', '@', '提及'],
        command: insertMention('TG'),
      },
      {
        id: 'mark',
        label: '高亮标记',
        description: '==高亮文本==',
        icon: Highlighter,
        keywords: ['mark', 'highlight', '高亮', '标记'],
        command: insertMark,
      },
      {
        id: 'insert',
        label: '插入标记',
        description: '++插入文本++',
        icon: Plus,
        keywords: ['insert', 'add', '插入', '添加'],
        command: insertInsertMark,
      },
      {
        id: 'footnote',
        label: '脚注',
        description: '[^1]',
        icon: Hash,
        keywords: ['footnote', 'reference', '脚注', '引用'],
        command: insertFootnote,
      },
    ],
  },
  {
    id: 'shiroi-advanced',
    label: 'Shiroi 高级块',
    items: [
      {
        id: 'container-warning',
        label: 'Container 警告',
        description: '::: warning',
        icon: Flag,
        keywords: ['container', 'warning', '容器', '警告'],
        command: insertContainer('warning'),
      },
      {
        id: 'container-banner',
        label: 'Banner 横幅',
        description: '::: banner {error}',
        icon: Zap,
        keywords: ['banner', 'container', '横幅', '容器'],
        command: insertContainer('banner {error}'),
      },
      {
        id: 'gallery',
        label: 'Gallery 画廊',
        description: '::: gallery 图片集',
        icon: Images,
        keywords: ['gallery', 'images', '画廊', '图片集'],
        command: insertGallery,
      },
      {
        id: 'grid',
        label: 'Grid 网格',
        description: '::: grid 网格布局',
        icon: Grid3x3,
        keywords: ['grid', 'layout', '网格', '布局'],
        command: insertGrid,
      },
      {
        id: 'linkcard',
        label: 'LinkCard 链接卡片',
        description: '<LinkCard> 卡片',
        icon: Link2,
        keywords: ['linkcard', 'card', 'link', '链接卡片', '卡片'],
        command: insertLinkCard,
      },
      {
        id: 'excalidraw',
        label: 'Excalidraw 手绘',
        description: '```excalidraw 手绘图',
        icon: Paintbrush,
        keywords: ['excalidraw', 'draw', 'whiteboard', '手绘', '画板'],
        command: insertExcalidraw,
      },
      {
        id: 'react-component',
        label: 'React 组件',
        description: '```component 远程组件',
        icon: Sparkles,
        keywords: ['component', 'react', 'remote', '组件', '远程'],
        command: insertReactComponent,
      },
    ],
  },
]

export interface SlashMenuItemWithGroup extends SlashMenuItem {
  groupId: string
  groupLabel: string
  icon?: Component
}

export const slashMenuItems: SlashMenuItemWithGroup[] = slashMenuGroups.flatMap(
  (group) =>
    group.items.map((item) => ({
      ...item,
      groupId: group.id,
      groupLabel: group.label,
    })),
)
