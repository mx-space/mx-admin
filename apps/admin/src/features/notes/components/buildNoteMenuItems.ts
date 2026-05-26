import { CloudSun, Copy, Smile } from 'lucide-react'
import { toast } from 'sonner'
import type { NoteModel } from '~/models/note'
import type { ListAction } from '~/ui/list-actions'
import type { ContextMenuItem } from '~/ui/overlay/context-menu'

import { presentNoteMetaEditModal } from './NoteMetaEditModal'

export interface BuildNoteMenuItemsOptions {
  actions: ReadonlyArray<ListAction<NoteModel>>
  externalHref: string
  onBookmarkToggle: (next: boolean) => void
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

function actionToItem<T>(
  action: ListAction<T> | undefined,
  target: T,
): ContextMenuItem | null {
  if (!action) return null
  if (action.available && !action.available([target])) return null
  return {
    danger: action.danger,
    extra: action.shortcutLabel,
    icon: action.icon,
    key: action.key,
    label: action.label,
    onClick: () => void action.run([target]),
  }
}

export function buildNoteMenuItems(
  note: NoteModel,
  options: BuildNoteMenuItemsOptions,
): ContextMenuItem[] {
  const find = (key: string) =>
    options.actions.find((action) => action.key === key)
  const items: ContextMenuItem[] = []

  const edit = actionToItem(find('edit'), note)
  if (edit) items.push(edit)
  const openExternal = actionToItem(find('open-external'), note)
  if (openExternal) items.push(openExternal)

  items.push(
    { key: 'sep-1', type: 'divider' },
    {
      checked: note.isPublished,
      key: 'publish',
      label: '已发布',
      onCheckedChange: options.onPublishToggle,
      type: 'checkbox',
    },
    {
      checked: note.bookmark,
      key: 'bookmark',
      label: '收藏',
      onCheckedChange: options.onBookmarkToggle,
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
        options.onMoodChange(next)
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
        options.onWeatherChange(next)
      },
    },
    { key: 'sep-3', type: 'divider' },
    {
      icon: Copy,
      key: 'copy-link',
      label: '复制链接',
      onClick: () => void copyText(options.externalHref, '链接'),
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
  )

  const remove = actionToItem(find('delete'), note)
  if (remove) {
    items.push({ key: 'sep-4', type: 'divider' }, remove)
  }

  return items
}
