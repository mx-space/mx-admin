import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CategoryFormMode, SelectedItem } from '../types/categories'

import { deleteCategory, getCategories, getTags } from '~/api/categories'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { MasterDetailLayout } from '~/ui/page-layout'
import { Scroll } from '~/ui/scroll'

import { getErrorMessage } from '../utils/errors'
import { CategoryDetail } from './CategoryDetail'
import { CategoryFormDialog } from './CategoryFormDialog'
import { CategoryRow } from './CategoryRow'
import { DetailEmpty } from './DetailEmpty'
import { EmptyList } from './EmptyList'
import { ListSection } from './ListSection'
import { TagDetail } from './TagDetail'
import { TagRow } from './TagRow'

export function CategoriesRouteViewContent() {
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
