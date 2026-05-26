import {
  CloudSun,
  Copy,
  ExternalLink,
  Pencil,
  Smile,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { NoteModel } from '~/models/note'
import type { ContextMenuItem } from '~/ui/overlay/context-menu'

import { presentNoteMetaEditModal } from './NoteMetaEditModal'

export interface NoteMenuHandlers {
  externalHref: string
  onBookmarkToggle: (next: boolean) => void
  onDelete: () => void
  onEdit: () => void
  onMoodChange: (next: string | null) => void
  onPublishToggle: (next: boolean) => void
  onWeatherChange: (next: string | null) => void
}

async function copyText(value: string | undefined | null, label: string) {
  const str = value == null ? '' : String(value)
  if (!str) {
    toast.error(`无 ${label} 可复制`)
    return
  }
  try {
    await navigator.clipboard.writeText(str)
    toast.success(`已复制${label}`)
  } catch {
    toast.error('复制失败')
  }
}

export function buildNoteMenuItems(
  note: NoteModel,
  handlers: NoteMenuHandlers,
): ContextMenuItem[] {
  return [
    {
      extra: '↵',
      icon: Pencil,
      key: 'edit',
      label: '编辑',
      onClick: () => handlers.onEdit(),
    },
    {
      icon: ExternalLink,
      key: 'open-external',
      label: '在新窗口打开',
      onClick: () =>
        window.open(handlers.externalHref, '_blank', 'noopener,noreferrer'),
    },
    { key: 'sep-1', type: 'divider' },
    {
      checked: note.isPublished,
      key: 'publish',
      label: '已发布',
      onCheckedChange: (next) => handlers.onPublishToggle(next),
      type: 'checkbox',
    },
    {
      checked: note.bookmark,
      key: 'bookmark',
      label: '收藏',
      onCheckedChange: (next) => handlers.onBookmarkToggle(next),
      type: 'checkbox',
    },
    { key: 'sep-2', type: 'divider' },
    {
      icon: Smile,
      key: 'mood',
      label: '修改心情',
      onClick: async () => {
        const next = await presentNoteMetaEditModal({
          initialValue: note.mood ?? '',
          label: '当前心情',
          placeholder: '愉悦 / 平静 / 倦怠 ...',
          title: '修改心情',
        })
        if (next === undefined) return
        handlers.onMoodChange(next)
      },
    },
    {
      icon: CloudSun,
      key: 'weather',
      label: '修改天气',
      onClick: async () => {
        const next = await presentNoteMetaEditModal({
          initialValue: note.weather ?? '',
          label: '当前天气',
          placeholder: '晴 / 多云 / 雨 ...',
          title: '修改天气',
        })
        if (next === undefined) return
        handlers.onWeatherChange(next)
      },
    },
    { key: 'sep-3', type: 'divider' },
    {
      icon: Copy,
      key: 'copy-link',
      label: '复制链接',
      onClick: () => void copyText(handlers.externalHref, '链接'),
    },
    {
      key: 'copy-id',
      label: '复制 ID',
      onClick: () => void copyText(note.id, 'ID'),
    },
    {
      key: 'copy-nid',
      label: '复制 #编号',
      onClick: () => void copyText(`#${note.nid}`, '编号'),
    },
    { key: 'sep-4', type: 'divider' },
    {
      danger: true,
      extra: '⌫',
      icon: Trash2,
      key: 'delete',
      label: '删除',
      onClick: () => handlers.onDelete(),
    },
  ]
}
