import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { PostModel } from '~/models/post'
import type { ListAction } from '~/ui/list-actions'
import type { ContextMenuItem } from '~/ui/overlay/context-menu'

export interface PostMenuCategoryOption {
  id: string
  name: string
}

export interface BuildPostMenuItemsOptions {
  actions: ReadonlyArray<ListAction<PostModel>>
  categories: PostMenuCategoryOption[]
  externalHref: string
  onCategoryChange: (categoryId: string) => void
  onPinToggle: (next: boolean) => void
  onPublishToggle: (next: boolean) => void
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

export function buildPostMenuItems(
  post: PostModel,
  options: BuildPostMenuItemsOptions,
): ContextMenuItem[] {
  const find = (key: string) =>
    options.actions.find((action) => action.key === key)

  const items: ContextMenuItem[] = []

  const edit = actionToItem(find('edit'), post)
  if (edit) items.push(edit)
  const openExternal = actionToItem(find('open-external'), post)
  if (openExternal) items.push(openExternal)

  items.push(
    { key: 'sep-1', type: 'divider' },
    {
      checked: post.isPublished ?? false,
      key: 'publish',
      label: '已发布',
      onCheckedChange: options.onPublishToggle,
      type: 'checkbox',
    },
    {
      checked: Boolean(post.pinAt),
      key: 'pin',
      label: '置顶',
      onCheckedChange: options.onPinToggle,
      type: 'checkbox',
    },
  )

  if (options.categories.length > 0) {
    items.push({
      children: options.categories.map<ContextMenuItem>((category) => ({
        icon: category.id === post.categoryId ? Check : undefined,
        key: `category-${category.id}`,
        label: category.name,
        onClick: () => options.onCategoryChange(category.id),
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
      onClick: () => void copyText(options.externalHref, '链接'),
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
  )

  const remove = actionToItem(find('delete'), post)
  if (remove) {
    items.push({ key: 'sep-3', type: 'divider' }, remove)
  }

  return items
}
