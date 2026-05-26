import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { NoteModel } from '~/models/note'
import type { ListAction } from '~/ui/list-actions'

export interface NoteActionHandlers {
  deleteMany: (notes: NoteModel[]) => Promise<void> | void
  navigateToEdit: (note: NoteModel) => void
  openExternal: (note: NoteModel) => void
}

export function buildNoteActions(
  handlers: NoteActionHandlers,
): ListAction<NoteModel>[] {
  return [
    {
      icon: Pencil,
      key: 'edit',
      label: '编辑',
      run: (targets) => handlers.navigateToEdit(targets[0]),
      shortcut: 'Enter',
      shortcutLabel: '↵',
    },
    {
      icon: ExternalLink,
      key: 'open-external',
      label: '在新窗口打开',
      run: (targets) => handlers.openExternal(targets[0]),
      shortcut: '$mod+Enter',
      shortcutLabel: '⌘↵',
    },
    {
      danger: true,
      icon: Trash2,
      key: 'delete',
      label: '删除',
      multi: true,
      run: (targets) => handlers.deleteMany(targets),
      shortcut: 'Backspace',
      shortcutLabel: '⌫',
    },
  ]
}
