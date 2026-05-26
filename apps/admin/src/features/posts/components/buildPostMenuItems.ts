import { Check, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PostModel } from '~/models/post'
import type { ContextMenuItem } from '~/ui/overlay/context-menu'

export interface PostMenuHandlers {
  externalHref: string
  onCategoryChange: (categoryId: string) => void
  onDelete: () => void
  onEdit: () => void
  onPinToggle: (next: boolean) => void
  onPublishToggle: (next: boolean) => void
}

export interface PostMenuCategoryOption {
  id: string
  name: string
}

async function copyText(value: string | undefined, label: string) {
  if (!value) {
    toast.error(`无 ${label} 可复制`)
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`已复制${label}`)
  } catch {
    toast.error('复制失败')
  }
}

export function buildPostMenuItems(
  post: PostModel,
  handlers: PostMenuHandlers,
  categories: PostMenuCategoryOption[],
): ContextMenuItem[] {
  const isPublished = post.isPublished ?? false
  const isPinned = Boolean(post.pinAt)

  const items: ContextMenuItem[] = [
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
      checked: isPublished,
      key: 'publish',
      label: '已发布',
      onCheckedChange: (next) => handlers.onPublishToggle(next),
      type: 'checkbox',
    },
    {
      checked: isPinned,
      key: 'pin',
      label: '置顶',
      onCheckedChange: (next) => handlers.onPinToggle(next),
      type: 'checkbox',
    },
  ]

  if (categories.length > 0) {
    items.push({
      children: categories.map<ContextMenuItem>((category) => ({
        icon: category.id === post.categoryId ? Check : undefined,
        key: `category-${category.id}`,
        label: category.name,
        onClick: () => handlers.onCategoryChange(category.id),
      })),
      key: 'category-submenu',
      label: '修改分类',
      type: 'submenu',
    })
  }

  items.push(
    { key: 'sep-2', type: 'divider' },
    {
      icon: Copy,
      key: 'copy-link',
      label: '复制链接',
      onClick: () => void copyText(handlers.externalHref, '链接'),
    },
    {
      key: 'copy-id',
      label: '复制 ID',
      onClick: () => void copyText(post.id, 'ID'),
    },
    {
      key: 'copy-slug',
      label: '复制 slug',
      onClick: () => void copyText(post.slug, 'slug'),
    },
    { key: 'sep-3', type: 'divider' },
    {
      danger: true,
      extra: '⌫',
      icon: Trash2,
      key: 'delete',
      label: '删除',
      onClick: () => handlers.onDelete(),
    },
  )

  return items
}
