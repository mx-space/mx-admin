import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit3,
  ExternalLink,
  FolderOpen,
  Hash,
  Loader2,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import type { CategoryModel, TagModel } from '~/models/category'
import type { PostModel } from '~/models/post'
import type { ReactNode } from 'react'
import type { CreateCategoryData } from '../api/categories'

import { WEB_URL } from '~/constants/env'
import { relativeTimeFromNow } from '~/utils/time'

import {
  createCategory,
  deleteCategory,
  getCategories,
  getPostsByTag,
  getTags,
  updateCategory,
} from '../api/categories'
import { getPosts } from '../api/posts'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { TextInput } from '../ui/text-field'

type SelectedItem =
  | {
      id: string
      kind: 'category'
    }
  | {
      kind: 'tag'
      name: string
    }

type CategoryFormMode =
  | {
      kind: 'create'
    }
  | {
      category: CategoryModel
      kind: 'edit'
    }

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [formMode, setFormMode] = useState<CategoryFormMode | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const categoriesQuery = useQuery({
    queryFn: () => getCategories({ type: 'Category' }),
    queryKey: ['categories', 'list'],
  })
  const tagsQuery = useQuery({
    queryFn: getTags,
    queryKey: ['categories', 'tags'],
  })

  const categories = categoriesQuery.data ?? []
  const tags = tagsQuery.data ?? []
  const selectedCategory =
    selectedItem?.kind === 'category'
      ? categories.find((item) => item.id === selectedItem.id)
      : null
  const selectedTag =
    selectedItem?.kind === 'tag'
      ? tags.find((item) => item.name === selectedItem.name)
      : null

  useEffect(() => {
    if (!selectedItem) return
    if (
      selectedItem.kind === 'category' &&
      categories.length > 0 &&
      !categories.some((item) => item.id === selectedItem.id)
    ) {
      setSelectedItem(null)
      setShowDetailOnMobile(false)
    }
    if (
      selectedItem.kind === 'tag' &&
      tags.length > 0 &&
      !tags.some((item) => item.name === selectedItem.name)
    ) {
      setSelectedItem(null)
      setShowDetailOnMobile(false)
    }
  }, [categories, selectedItem, tags])

  const invalidateCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除分类失败')),
    onSuccess: async () => {
      toast.success('分类已删除')
      setSelectedItem(null)
      setShowDetailOnMobile(false)
      await invalidateCategories()
    },
  })

  const selectItem = (item: SelectedItem) => {
    setSelectedItem(item)
    setShowDetailOnMobile(true)
  }

  return (
    <MasterDetailLayout
      defaultSize={0.34}
      maxSize={0.44}
      minSize={0.25}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex h-full min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="inline-flex items-center gap-2 text-sm font-medium">
                <FolderOpen aria-hidden="true" className="size-4" />
                分类与标签
              </h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {categories.length} / {tags.length}
            </span>
            <Button
              onClick={() => setFormMode({ kind: 'create' })}
              type="button"
              variant="subtle"
            >
              <Plus aria-hidden="true" className="size-4" />
              新建
            </Button>
          </div>

          <Scroll className="min-h-0 flex-1">
            <ListSection
              count={categories.length}
              title="分类"
              loading={categoriesQuery.isLoading}
            >
              {categories.length === 0 && !categoriesQuery.isLoading ? (
                <EmptyList
                  action={
                    <Button
                      className="mt-3"
                      onClick={() => setFormMode({ kind: 'create' })}
                      type="button"
                    >
                      创建分类
                    </Button>
                  }
                  label="暂无分类"
                />
              ) : (
                categories.map((category) => (
                  <CategoryRow
                    category={category}
                    key={category.id}
                    onSelect={() =>
                      selectItem({ id: category.id, kind: 'category' })
                    }
                    selected={
                      selectedItem?.kind === 'category' &&
                      selectedItem.id === category.id
                    }
                  />
                ))
              )}
            </ListSection>

            <ListSection
              count={tags.length}
              title="标签"
              loading={tagsQuery.isLoading}
            >
              {tags.length === 0 && !tagsQuery.isLoading ? (
                <EmptyList label="暂无标签" />
              ) : (
                tags.map((tag) => (
                  <TagRow
                    key={tag.name}
                    onSelect={() => selectItem({ kind: 'tag', name: tag.name })}
                    selected={
                      selectedItem?.kind === 'tag' &&
                      selectedItem.name === tag.name
                    }
                    tag={tag}
                  />
                ))
              )}
            </ListSection>
          </Scroll>
        </section>
      }
      detail={
        <section className="h-full min-h-0">
          {selectedCategory ? (
            <CategoryDetail
              category={selectedCategory}
              deleting={deleteMutation.isPending}
              onBack={() => setShowDetailOnMobile(false)}
              onDelete={(category) => {
                if (window.confirm(`确认删除「${category.name}」？`)) {
                  deleteMutation.mutate(category.id)
                }
              }}
              onEdit={(category) => setFormMode({ category, kind: 'edit' })}
            />
          ) : selectedTag ? (
            <TagDetail
              onBack={() => setShowDetailOnMobile(false)}
              tag={selectedTag}
            />
          ) : (
            <DetailEmpty />
          )}
        </section>
      }
    >
      {formMode ? (
        <CategoryFormDialog
          mode={formMode}
          onClose={() => setFormMode(null)}
          onSaved={async (category) => {
            setFormMode(null)
            setSelectedItem({ id: category.id, kind: 'category' })
            setShowDetailOnMobile(true)
            await invalidateCategories()
          }}
        />
      ) : null}
    </MasterDetailLayout>
  )
}

function ListSection(props: {
  children: ReactNode
  count: number
  loading: boolean
  title: string
}) {
  return (
    <section>
      <div className="flex h-9 items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <h3 className="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
          {props.title}
        </h3>
        <span className="text-xs tabular-nums text-neutral-400">
          {props.count}
        </span>
      </div>
      {props.loading ? <ListSkeleton /> : props.children}
    </section>
  )
}

function CategoryRow(props: {
  category: CategoryModel
  onSelect: () => void
  selected: boolean
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors dark:border-neutral-800/60',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <FolderOpen
        aria-hidden="true"
        className="size-4 shrink-0 text-neutral-400"
      />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.category.name}
        </h4>
        <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate font-mono text-xs text-neutral-400">
          <Hash aria-hidden="true" className="size-3 shrink-0" />
          {props.category.slug}
        </p>
      </div>
      <span className="text-xs tabular-nums text-neutral-400">
        {props.category.count}
      </span>
    </button>
  )
}

function TagRow(props: {
  onSelect: () => void
  selected: boolean
  tag: TagModel
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors dark:border-neutral-800/60',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <Tag aria-hidden="true" className="size-4 shrink-0 text-neutral-400" />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.tag.name}
        </h4>
        <p className="mt-0.5 text-xs text-neutral-400">标签</p>
      </div>
      <span className="text-xs tabular-nums text-neutral-400">
        {props.tag.count}
      </span>
    </button>
  )
}

function CategoryDetail(props: {
  category: CategoryModel
  deleting: boolean
  onBack: () => void
  onDelete: (category: CategoryModel) => void
  onEdit: (category: CategoryModel) => void
}) {
  const postsQuery = useQuery({
    enabled: !!props.category.id,
    queryFn: () =>
      getPosts({
        categoryIds: [props.category.id],
        page: 1,
        size: 20,
        sort_by: 'createdAt',
        sort_order: 'desc',
      }).then((result) => result.data),
    queryKey: ['posts', 'category-detail', props.category.id],
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DetailHeader onBack={props.onBack} title="分类详情">
        <Button
          onClick={() => props.onEdit(props.category)}
          type="button"
          variant="subtle"
        >
          <Edit3 aria-hidden="true" className="size-4" />
          编辑
        </Button>
        <Button
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={props.deleting}
          onClick={() => props.onDelete(props.category)}
          type="button"
          variant="subtle"
        >
          {props.deleting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" className="size-4" />
          )}
          删除
        </Button>
      </DetailHeader>

      <Scroll className="min-h-0 flex-1" innerClassName="p-5">
        <EntitySummary
          countLabel={`${props.category.count} 篇文章`}
          icon={<FolderOpen aria-hidden="true" className="size-6" />}
          meta={props.category.slug}
          title={props.category.name}
        />
        <PostListSection
          emptyText="该分类下暂无文章"
          loading={postsQuery.isLoading}
          posts={postsQuery.data ?? []}
          title="该分类下的文章"
        />
      </Scroll>
    </div>
  )
}

function TagDetail(props: { onBack: () => void; tag: TagModel }) {
  const postsQuery = useQuery({
    enabled: !!props.tag.name,
    queryFn: () => getPostsByTag(props.tag.name),
    queryKey: ['posts', 'tag-detail', props.tag.name],
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DetailHeader onBack={props.onBack} title="标签详情" />
      <Scroll className="min-h-0 flex-1" innerClassName="p-5">
        <EntitySummary
          countLabel={`${props.tag.count} 篇文章`}
          icon={<Tag aria-hidden="true" className="size-6" />}
          title={props.tag.name}
        />
        <PostListSection
          emptyText="暂无关联文章"
          loading={postsQuery.isLoading}
          posts={postsQuery.data ?? []}
          title={`「${props.tag.name}」关联的文章`}
        />
      </Scroll>
    </div>
  )
}

function DetailHeader(props: {
  children?: ReactNode
  onBack: () => void
  title: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
        APP_SHELL_HEADER_HEIGHT_CLASS,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
          onClick={props.onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </button>
        <h2 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.title}
        </h2>
      </div>
      {props.children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {props.children}
        </div>
      ) : null}
    </div>
  )
}

function EntitySummary(props: {
  countLabel: string
  icon: ReactNode
  meta?: string
  title: string
}) {
  return (
    <section className="mb-6 flex items-start gap-4 rounded border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="flex size-12 shrink-0 items-center justify-center rounded bg-white text-neutral-500 dark:bg-neutral-950 dark:text-neutral-300">
        {props.icon}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          {props.title}
        </h3>
        {props.meta ? (
          <p className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            <Hash aria-hidden="true" className="size-3" />
            {props.meta}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {props.countLabel}
        </p>
      </div>
    </section>
  )
}

function PostListSection(props: {
  emptyText: string
  loading: boolean
  posts: PostModel[]
  title: string
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {props.title}
        </h3>
        {!props.loading && props.posts.length > 0 ? (
          <span className="text-xs text-neutral-400">
            {props.posts.length} 篇
          </span>
        ) : null}
      </div>
      {props.loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
              key={index}
            />
          ))}
        </div>
      ) : props.posts.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
          {props.emptyText}
        </p>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-800">
          {props.posts.map((post) => (
            <PostListRow key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}

function PostListRow(props: { post: PostModel }) {
  const externalHref = `${WEB_URL}/posts/${props.post.category?.slug ?? props.post.categoryId}/${props.post.slug}`

  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 last:border-b-0 dark:border-neutral-800">
      <Link
        className="min-w-0 flex-1"
        title="编辑文章"
        to={`/posts/edit?id=${props.post.id}`}
      >
        <p className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.post.title || '未命名文章'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <time dateTime={props.post.createdAt}>
            {relativeTimeFromNow(props.post.createdAt)}
          </time>
          <span>{props.post.readCount ?? 0} 阅读</span>
        </div>
      </Link>
      <a
        className="inline-flex size-8 shrink-0 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
        href={externalHref}
        rel="noreferrer"
        target="_blank"
        title="打开文章"
      >
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
    </div>
  )
}

function CategoryFormDialog(props: {
  mode: CategoryFormMode
  onClose: () => void
  onSaved: (category: CategoryModel) => Promise<void>
}) {
  const [name, setName] = useState(
    props.mode.kind === 'edit' ? props.mode.category.name : '',
  )
  const [slug, setSlug] = useState(
    props.mode.kind === 'edit' ? props.mode.category.slug : '',
  )
  const title = props.mode.kind === 'edit' ? '编辑分类' : '新建分类'

  const mutation = useMutation({
    mutationFn: (data: CreateCategoryData) =>
      props.mode.kind === 'edit'
        ? updateCategory(props.mode.category.id, { ...data, type: 0 })
        : createCategory(data),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '分类保存失败')),
    onSuccess: async (category) => {
      toast.success(props.mode.kind === 'edit' ? '分类已更新' : '分类已创建')
      await props.onSaved(category)
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
    }

    if (!payload.name || !payload.slug) {
      toast.error('名称和路径不能为空')
      return
    }

    mutation.mutate(payload)
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <form onSubmit={onSubmit}>
            <div className="mb-5">
              <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                {title}
              </Dialog.Title>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                分类名称用于后台管理，路径用于公开 URL。
              </p>
            </div>
            <div className="grid gap-4">
              <TextInput
                autoFocus
                label="名称"
                labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                onChange={setName}
                value={name}
              />
              <TextInput
                controlClassName="font-mono"
                label="路径"
                labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                onChange={setSlug}
                value={slug}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={props.onClose} type="button" variant="subtle">
                取消
              </Button>
              <Button disabled={mutation.isPending} type="submit">
                {mutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                保存
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ListSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/60"
          key={index}
        >
          <div className="size-4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          </div>
          <div className="h-3 w-6 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function EmptyList(props: { action?: ReactNode; label: string }) {
  return (
    <div className="border-b border-neutral-100 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800/60 dark:text-neutral-400">
      <p>{props.label}</p>
      {props.action}
    </div>
  )
}

function DetailEmpty() {
  return (
    <div className="flex h-full min-h-[28rem] items-center justify-center px-4 text-center">
      <div>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
          <FolderOpen aria-hidden="true" className="size-7" />
        </div>
        <h2 className="mt-4 text-base font-medium text-neutral-950 dark:text-neutral-50">
          选择一个分类或标签
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          选择后可查看关联文章、编辑分类或删除分类。
        </p>
      </div>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
